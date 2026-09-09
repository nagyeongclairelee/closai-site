/**
 * closai.kr 폼 수신 — Google Apps Script 웹앱
 *
 * 하는 일: 사이트의 진단하기/문의하기 폼이 보낸 JSON을 받아
 *   1) 이 스프레드시트의 'diagnosis' 또는 'contact' 탭에 한 줄 추가
 *   2) NOTIFY_TO 주소로 요약 메일 발송
 *
 * 배포 방법은 저장소 README.md 참고.
 */

var NOTIFY_TO = 'claire@closai.kr';

// 시트 열 순서 = 폼 문항 순서. 첫 실행 때 헤더가 없으면 자동으로 만든다.
var COLUMNS = {
  diagnosis: [
    ['submitted_at', '제출 시각'],
    ['company', '회사·브랜드명'],
    ['industry', '업종'],
    ['size', '규모'],
    ['name', '담당자'],
    ['email', '이메일'],
    ['phone', '전화번호'],
    ['contact_pref', '선호 연락'],
    ['source', '알게 된 경로'],
    ['tasks', '반복 업무'],
    ['dreaded', '미루는 업무'],
    ['frequency', '빈도(회/주)'],
    ['duration', '1회 소요'],
    ['exceptions', '예외(10회 중)'],
    ['tools', '현재 도구'],
    ['goal', '3개월 뒤 목표'],
    ['meeting', '미팅 방식'],
    ['timeslot', '가능 시간대'],
    ['weekly_hours', '주당 시간(계산)'],
    ['consent', '개인정보 동의'],
    ['page', '제출 페이지']
  ],
  contact: [
    ['submitted_at', '제출 시각'],
    ['name', '이름'],
    ['email', '이메일'],
    ['message', '내용'],
    ['consent', '개인정보 동의'],
    ['page', '제출 페이지']
  ]
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var type = data.type === 'contact' ? 'contact' : 'diagnosis';
    var cols = COLUMNS[type];

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(type) || ss.insertSheet(type);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cols.map(function (c) { return c[1]; }));
      sheet.setFrozenRows(1);
    }

    data.submitted_at = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    sheet.appendRow(cols.map(function (c) { return data[c[0]] == null ? '' : String(data[c[0]]); }));

    notify(type, data, cols);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function notify(type, data, cols) {
  var subject = type === 'contact'
    ? '[closai 문의] ' + (data.name || '') + ' — ' + String(data.message || '').slice(0, 30)
    : '[closai 진단 신청] ' + (data.company || '') + ' · ' + (data.name || '') + ' · ' + (data.contact_pref || '');
  var body = cols.map(function (c) {
    return c[1] + ': ' + (data[c[0]] == null ? '' : data[c[0]]);
  }).join('\n');
  body += '\n\n시트: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail({ to: NOTIFY_TO, subject: subject, body: body, name: 'closai.kr' });
}

// 배포 확인용. 웹앱 URL을 브라우저로 열면 이 문구가 보인다.
function doGet() {
  return ContentService.createTextOutput('closai form endpoint OK');
}
