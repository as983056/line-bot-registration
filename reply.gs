function doPost(e){
  var CHANNEL_ACCESS_TOKEN = 'YOUR_TOKEN';
  var msg= JSON.parse(e.postData.contents);

  //從msg變數中的訊息裡取出replyToken
  var reply_message = '';
  var replyToken = msg.events[0].replyToken;
  var userMessage = msg.events[0].message.text;//使用者訊息
  const user_id = msg.events[0].source.userId;
  var nameurl = "https://api.line.me/v2/bot/profile/" + user_id;
  
  try {
    //呼叫LINE User Info API，從使用者ID取得該帳號的資料
    var response = UrlFetchApp.fetch(nameurl, {
      "method": "GET",
      "headers": {
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
        "Content-Type": "application/json"
      },
    });

    var namedata = JSON.parse(response);
    var line_user_name = namedata.displayName;//使用者名稱
    var line_user_id = namedata.userId;//使用者ID
  }
  catch{
    var line_user_name = "找不到用戶";
  }
  
  if (typeof replyToken === 'undefined') {
    return;
  };

  //連結google試算表
  var sheet_url = 'YOUR_SHEET_URL';
  var sheet_name = '當前可報名活動';
  var SpreadSheet = SpreadsheetApp.openByUrl(sheet_url);
  var reserve_list = SpreadSheet.getSheetByName(sheet_name);
  var current_list_row = reserve_list.getLastRow();
  var day = Utilities.formatDate(new Date(), "GMT+8", "YYYY/m/d");
  var hours = Utilities.formatDate(new Date(), "GMT+8", "HH");
  
  //圖文選單
  switch(userMessage){
    case '查詢活動':
      //當前沒有活動訊息
      if(reserve_list.getRange(2, 1).getValue() == ''){
        reply_message = [{
          type : 'text',
          text : '不好意思當前沒有任何活動可以報名😓'
        }];
        break;
      }
      //把所有目前活動整合起來
      var columns = [];
      for(i = 2; i <= current_list_row; i++){
        var activity_title = reserve_list.getRange(i, 1).getValue();//活動名稱
        var activity_text = reserve_list.getRange(i, 2).getValue();//活動內文
        var activity_image = reserve_list.getRange(i, 6).getValue();//活動圖片
        var column = {
          "thumbnailImageUrl": activity_image,
          "imageBackgroundColor": "#FFFFFF",
          "title": activity_title,
          "text": activity_text,
          "actions": [{
            "type": "message",
            "label": "我要報名",
            "text": "我要報名：" + activity_title
          }]
        };
        columns.push(column)
      }
      reply_message = [{
        "type": "template",
        "altText": "活動詳細資料",
        "template": {
          "type": "carousel",
          "columns": columns
        }
      }]
    break;
    case '聯絡客服':
      //客服聯絡時段10:00-22:00
      if(hours >= 10 && hours < 22){
        //回應訊息
        reply_message = [{
          type : 'text',
          text : '已幫您聯絡客服，請您稍待片刻並請不要重複按此按鈕'
        }]
        //讓官方帳號主動私訊我(每位使用者必須等30分鐘才能再次使用)
        if(pushtime(line_user_id)){
          var push_url = 'https://api.line.me/v2/bot/message/push';
          UrlFetchApp.fetch(push_url, {
            'headers': {
              'Content-Type': 'application/json; charset=UTF-8',
              'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
            },
              'method': 'post',
              'payload': JSON.stringify({
              'to':  'ID',
              'messages': [{
                type : 'text',
                text : `請留意來自客戶"${line_user_name}"的訊息`
              }],
            }),
          }); 
        }
      }
      else{
        //回應訊息
        reply_message = [{
          type : 'text',
          text : '不好意思目前客服正在休息中\n請您在每日的10:00-22:00之間聯絡客服'
        }]
      }
    break;
  }

  //報名活動
  if(userMessage.slice(0, 5) == '我要報名：'){
    var action_name = userMessage.slice(5);//活動名稱
    var action_reserve_list = SpreadSheet.getSheetByName(action_name);
    var action_current_list_row = action_reserve_list.getLastRow();
    //如果不在活動日期內
    reply_message = [{
      type : 'text',
      text : '不好意思目前找不到此活動，可能尚未開始或已經截止了，請使用選單的查詢活動來查看目前活動'
    }]
    //查詢活動是否報名了
    for(i = 1; i <= action_current_list_row; i++){
      if(line_user_id == action_reserve_list.getRange(i, 1).getValue()){
        reply_message = [{
          type : 'text',
          text : '不好意思您已經報名此活動囉'
        }]
        var action_check = true;
        break;
      }
    }
    if(action_check != true){
      action_reserve_list.getRange(action_current_list_row + 1, 1).setValue(line_user_id);
      reply_message = [{
        type : 'text',
        text : '恭喜您成功報名此活動囉'
      }]
    }
  }

  if(reply_message != ''){
    //回傳訊息給line 並傳送給使用者
    var url = 'https://api.line.me/v2/bot/message/reply';
    UrlFetchApp.fetch(url, {
        'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
      },
      'method': 'post',
      'payload': JSON.stringify({
        'replyToken': replyToken,
        'messages': reply_message,
      }),
    });
  }
}
