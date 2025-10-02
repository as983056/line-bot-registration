//放入計時器，每日凌晨更新

function sheetupdata() {
  //連結google試算表
  var sheet_url = 'YOUR_SHEET_URL';
  var sheet_name = 'SHEET_NAME';
  var SpreadSheet = SpreadsheetApp.openByUrl(sheet_url);
  var reserve_list = SpreadSheet.getSheetByName(sheet_name);
  var current_list_row = reserve_list.getLastRow();
  for(i = 2; i <= current_list_row; i++){
    //判斷標題，並確認是否有核取方塊
    var title = reserve_list.getRange(i, 1).getValue();
    if(title != ''){
      //新增核取方塊
      reserve_list.getRange(i, 8).insertCheckboxes();
    }
    else{
      //刪除核取方塊
      reserve_list.getRange(i, 8).removeCheckboxes();
    }

    //當核取方塊被打勾時，確認是否建立了活動工作表
    var checkbox = reserve_list.getRange(i, 8).isChecked();
    if(checkbox == true){
      try{
        var newsheet = SpreadSheet.insertSheet(title);
        newsheet.appendRow(["ID","名稱","電話"]);
      }
      catch{
      }
    }
  }
}
