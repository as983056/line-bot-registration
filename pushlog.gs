//利用GAS的Script Properties來記錄每個使用者的最後推播時間，用來限制短時間內重複推播

function pushtime(line_user_id) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var lastsent_user = scriptProperties.getProperty(line_user_id);
  var now = new Date().getTime();
  var mins = 30; //限制30分鐘過後才允許push
  if (lastsent_user) {
    var lastSent = parseInt(lastsent_user, 10);
    if (now - lastSent < mins * 60 * 1000) {
      return false;
    }
  }
  // 更新最後推播時間
  scriptProperties.setProperty(line_user_id, now.toString());
  return true;
}
