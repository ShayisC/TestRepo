//Handles Clear Fields Button
function ClearFields() {
  if (
    confirmAlert("Are you sure you want to clear the match and bet details?")
  ) {
    ClearContens();
  }
}
//Clear contents for a new match
function ClearContens() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  //range('B3:B22').setva();
  sheet.getRange("D3").setValue("Select Match ID");
  sheet.getRange("ValidationMessage").setValue("");
  //sheet.getRange('D3:F3').clearContent();
  //Clear Logs
  var logsheet = SpreadsheetApp.getActive().getSheetByName("Log");
  logsheet.clear();
  //Clear Log end
}
// Handles Update Balance Click
function CalculateBalance() {
  //Clear Logs
  var sheet = SpreadsheetApp.getActive().getSheetByName("Log");
  sheet.clear();
  //Clear Log end
  if (confirmAlert("Are you sure you want to update the Balance?")) {
    if (UpdateBalances()) showAlert("Balance Updated");
  }
}
// Update Balance and History Logic
function UpdateBalances() {
  var participantCount = 0;
  var rightPredictionCount = 0;
  var wrongPredictionCount = 0;

  //Get worksheet Data
  var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  var data = sheet.getDataRange().getValues();

  const resultdata = myGetRangeByName("result");
  const betAmount = myGetRangeByName("betamount");
  const selectedMatch = myGetRangeByName("SelectedMatchId");

  //Get Participant Count,Right Prediction, Wrong Prediction
  for (var i = 2; i < data.length; i++) {
    var betData = data[i][1];
    if (betData != "") {
      participantCount += 1;
      if (betData == resultdata) rightPredictionCount += 1;
      else wrongPredictionCount += 1;
    }
  }
  writeLog(["Right Prediction Count :" + rightPredictionCount]);
  writeLog(["Wrong Prediction Count :" + wrongPredictionCount]);
  if (selectedMatch == "Select Match ID") {
    showAlert("Please select a match");
    writeLog(["Aborted     :" + "Match not selected"]);
    return false;
  }

  if (participantCount <= 1) {
    showAlert("Participant Count should be more than 1");
    writeLog(["Aborted     :" + "Participant Count should be more than 1"]);
    return false;
  }

  if (wrongPredictionCount == participantCount) {
    showAlert("Nobody wins");
    writeLog(["Aborted     :" + "Nobody wins"]);
    return false;
  }

  if (rightPredictionCount == 0 || wrongPredictionCount == 0) {
    showAlert("No opponent");
    writeLog(["Aborted     :" + "No opponent"]);
    return false;
  }

  writeLog(["Participant Count      :" + participantCount]);
  writeLog(["Result                 :" + resultdata]);
  writeLog(["Bet Amount             :" + betAmount]);

  var sumOfBetAmount = participantCount * betAmount;
  writeLog(["Total Bet Amount       :" + sumOfBetAmount]);

  var wrongPredictionAmount = wrongPredictionCount * betAmount;
  writeLog(["Wrong prediction Sum   :" + wrongPredictionAmount]);

  var rightPredictionShare = wrongPredictionAmount / rightPredictionCount;
  writeLog(["Right prediction gain  :" + rightPredictionShare]);

  var wrongPredictionDeduction = -betAmount;
  writeLog(["Wrong prediction lose  :" + wrongPredictionDeduction]);

  //Update Balance
  for (var i = 2; i < data.length; i++) {
    var name = data[i][0];
    var betData = data[i][1];
    if (betData != "") {
      if (betData == resultdata) {
        updateBalanceByName(name, rightPredictionShare);
        updateHistory(selectedMatch, name, betData, rightPredictionShare);
      } else {
        updateBalanceByName(name, wrongPredictionDeduction);
        updateHistory(selectedMatch, name, betData, wrongPredictionDeduction);
      }
    }
  }
  return true;
}
//Get value by cell name
function myGetRangeByName(n) {
  // just a wrapper
  var cell = SpreadsheetApp.getActiveSpreadsheet()
    .getRangeByName(n)
    .getA1Notation();
  return SpreadsheetApp.getActiveSheet().getRange(cell).getValue();
}

//Write Log
function writeLog(data) {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  const resultdata = sheet.getRange("H5").getValue();
  var logsheet = SpreadsheetApp.getActive().getSheetByName("Log");
  if (resultdata == true) {
    logsheet.appendRow(["Debug Mode : " + resultdata]);
    logsheet.appendRow(data);
  }
}

// Update balance on Balance Sheet
function updateBalanceByName(name, amount) {
  //To do - Update Balance sheet +/- amount based on the name passed
  //Store the current balance amount into a variable "currBalance"
  //Get worksheet Data
  var sheet = SpreadsheetApp.getActive().getSheetByName("Balance");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var balName = data[i][0];
    if (balName == name) {
      var balance = data[i][1];
      writeLog(["Balance Tab Balance  :" + balance]);
      var updatedBalance = 0;
      if (balance == "") updatedBalance = amount;
      else updatedBalance = balance + amount;

      writeLog(["Balance Tab UpdatedBalance  :" + updatedBalance]);
      var cell = sheet.getRange(name);
      cell.setValue(updatedBalance);
    }
  }
}
// unit test wrapper
function test() {
  if (checkTimeValidity("20/11/2022@19:00")) console.log("val");
  else console.log("inv");
}
// Check time of match against bet submission
function checkTimeValidity(formDate) {
  var datetime = Utilities.formatDate(new Date(), "GMT+3", "dd/MM/yyyy HH:mm"); // "yyyy-MM-dd'T'HH:mm:ss'Z'"
  var currentTime = datetime.split(" ")[1];
  var currentDate = datetime.split(" ")[0];

  var matchDate = formDate.split("@")[0];
  var matchTime = formDate.split("@")[1];

  var currentDateVal = new Date(
    currentDate.split("/")[2],
    currentDate.split("/")[1],
    currentDate.split("/")[0]
  );
  var matchDateVal = new Date(
    matchDate.split("/")[2],
    matchDate.split("/")[1],
    matchDate.split("/")[0]
  );

  if (currentDateVal < matchDateVal) return true;

  if (currentDateVal > matchDateVal) return false;

  var currenthour = currentTime.split(":")[0];
  var currentMinute = currentTime.split(":")[1];
  var matchhour = matchTime.split(":")[0];
  var matchMinute = matchTime.split(":")[1];

  if (currentDateVal.valueOf() == matchDateVal.valueOf()) {
    if (parseInt(currenthour) < parseInt(matchhour)) return true;

    if (parseInt(currenthour) > parseInt(matchhour)) return false;

    if (parseInt(currenthour) == parseInt(matchhour)) {
      if (parseInt(currentMinute) > parseInt(matchMinute)) return false;
      else return true;
    }
  }
}
function onFormSubmit(event) {
  console.log(event.namedValues); //[ '15/11/2022 01:02:40', 'Shayis', 'Win', '', '120', '111', '', '' ]
  var validation_messages = event.namedValues;
  var keys = [];
  var pName = "";
  var passcode = "";
  var newPasscode = "";
  var timeStamp = Utilities.formatDate(new Date(), "GMT+3", "dd/MM/yyyy HH:mm");
  for (var k in validation_messages) {
    keys.push(k + ":" + validation_messages[k]);

    if (k.indexOf("Select Your Name") > -1) {
      var value = validation_messages[k];
      if (value != "" && value != ",") {
        pName = value;
      }
    }
    if (k.indexOf("Enter your Passcode") > -1) {
      var value = validation_messages[k];
      if (value != "" && value != ",") {
        passcode = value;
      }
    }
    if (k.indexOf("New Passcode") > -1) {
      var value = validation_messages[k];
      if (value != "" && value != ",") {
        newPasscode = value;
      }
    }
  }
  //console.log(passcode + "-" + newPasscode)
  var isWrongPasscode = false;
  var worksheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  var setPasscode = worksheet.getRange("P" + pName).getValue();
  if (setPasscode != passcode) {
    isWrongPasscode = true;
  }

  for (var k in validation_messages) {
    keys.push(k + ":" + validation_messages[k]);

    if (k.indexOf("Place your bet for team - ") > -1) {
      var country = k.replace("Place your bet for team - ", "");
      //var qTime = Utilities.formatDate(new Date("11/24/2022"), "GMT+3", "MM/dd/yyyy")
      var value = validation_messages[k];
      var checkvalueexists = false;
      var betValue;
      for (var index in value) {
        if (value[index] != "") {
          checkvalueexists = true;
          betValue = value[index];
        }
      }
      if (checkvalueexists) {
        var matchInfo = country.split("-");

        if (isWrongPasscode) {
          var sheet = SpreadsheetApp.getActive().getSheetByName("InvalidBets");
          sheet.appendRow([
            matchInfo[0],
            matchInfo[1],
            pName.join(),
            betValue,
            " Incorrect passcode entered - " + passcode,
            timeStamp,
          ]);
        } else {
          var validTime = false;
          validTime = checkTimeValidity(matchInfo[1]);
          if (validTime) {
            var sheet = SpreadsheetApp.getActive().getSheetByName("Bets");
            sheet.appendRow([
              matchInfo[0],
              matchInfo[1],
              pName.join(),
              betValue,
              timeStamp,
            ]);
          } else {
            var sheet =
              SpreadsheetApp.getActive().getSheetByName("InvalidBets");
            sheet.appendRow([
              matchInfo[0],
              matchInfo[1],
              pName.join(),
              betValue,
              " Match started",
              timeStamp,
            ]);
          }
          if (newPasscode != "")
            worksheet.getRange("P" + pName).setValue(newPasscode);
        }
      }
    }
  }
}
// Call explicitely to clear all questions
function clearQuestion() {
  var form = FormApp.openById("1hSvfw9kTmFymwYN_eTV7qSycwTQlFbPsLNLcUFOscd8");
  //clearing old questions
  var multipleChoiceItems = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
  itemIndex = 0;
  while (itemIndex < multipleChoiceItems.length) {
    multipleChoiceItems[itemIndex].asMultipleChoiceItem().setChoiceValues([""]);
    form.deleteItem(multipleChoiceItems[itemIndex]);
    itemIndex++;
  }
}
// Get matches and update form
function getNextMatch(matchdate) {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Fixture");
  var data = sheet.getDataRange().getValues();
  //var qTime = Utilities.formatDate(new Date(matchdate), "GMT+3", "dd/MM/yyyy")

  var matches = [];
  for (var i = 4; i < data.length; i++) {
    var date = data[i][2];
    //console.log('dd'+ date)
    if (date == matchdate) {
      matches.push(data[i][4] + "-" + date + "@" + data[i][3]);
    }
  }
  var form = FormApp.openById("1hSvfw9kTmFymwYN_eTV7qSycwTQlFbPsLNLcUFOscd8");
  //clearing old questions
  var multipleChoiceItems = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
  itemIndex = 0;
  while (itemIndex < multipleChoiceItems.length) {
    multipleChoiceItems[itemIndex].asMultipleChoiceItem().setChoiceValues([""]);
    form.deleteItem(multipleChoiceItems[itemIndex]);
    itemIndex++;
  }

  //setting new questions
  for (var j = 0; j < matches.length; j++) {
    let item = form.addMultipleChoiceItem();
    item.setTitle("Place your bet for team - " + matches[j]);
    item.setChoiceValues(["Win", "Lose", "Draw"]);
    if (matches.length == 1) item.setRequired(true);
  }
}

function setFormData(e) {
  var range = e.range;

  if (
    range.columnEnd == 8 &&
    range.columnStart == 8 &&
    range.rowEnd == 3 &&
    range.rowStart == 3 &&
    e.oldValue == "false"
  ) {
    var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
    sheet.getRange("ValidationMessage").setValue("Updating Form Questions..");

    const matchDate = sheet.getRange("H2").getValue();

    if (matchDate == "") {
      sheet.getRange("ValidationMessage").setValue("Please select a match");
      writeLog(["Aborted     :" + "Match not selected"]);
      range.uncheck();
      return false;
    }
    try {
      var form = FormApp.openById(
        "1hSvfw9kTmFymwYN_eTV7qSycwTQlFbPsLNLcUFOscd8"
      );
      // Clear previous form responses
      form.deleteAllResponses();
      //Set next match on Form
      getNextMatch(matchDate);
      sheet.getRange("ValidationMessage").setValue("Form updated..");
      sheet.getRange("H3").uncheck();
    } catch (e) {
      sheet.getRange("H3").uncheck();
      sheet.getRange("ValidationMessage").setValue(e);
    }
  }
}
//Run explicitely to update participant list
function updatePlayerListOnForm() {
  var form = FormApp.openById("1hSvfw9kTmFymwYN_eTV7qSycwTQlFbPsLNLcUFOscd8");
  // var items = form.getItems();
  // for(var i in items){
  //   console.log(items[i].getTitle() + items[i].getId())
  // }
  var betplayers = form.getItemById("369297633");
  var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  var list = sheet.getRange("players").getValues();

  betplayers.asListItem().setChoiceValues(list.sort());
}

// Update history sheet
function updateHistory(matchid, name, vote, balanceeffect) {
  // To do - Update History tab with, matchid, name, amount added/amount deducted
  var sheet = SpreadsheetApp.getActive().getSheetByName("History");
  sheet.appendRow([matchid, name, vote, balanceeffect]);
}

// User confirmation
function confirmAlert(message) {
  var ui = SpreadsheetApp.getUi(); // Same variations.
  var result = ui.alert("Please confirm", message, ui.ButtonSet.YES_NO);

  // Process the user's response.
  if (result == ui.Button.YES) {
    return true;
  } else {
    return false;
  }
}
// User Alert
function showAlert(message) {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
  if (sheet.getRange("J16").isChecked() == true) {
    sheet.getRange("ValidationMessage").setValue(message);
  } else {
    var ui = SpreadsheetApp.getUi(); // Same variations.
    ui.alert("Message", message, ui.ButtonSet.OK);
  }
}

// OnEdit handles mobile control functionalities
function onEdit(e) {
  const range = e.range;
  // Clear fields
  if (
    range.getA1Notation() == "J13" &&
    range.isChecked() &&
    range.getSheet().getName() == "Worksheet"
  ) {
    var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
    sheet.getRange("ValidationMessage").setValue("Clearing fields..");

    if (sheet.getRange("J14").isChecked() == false)
      sheet
        .getRange("ValidationMessage")
        .setValue("Please tick the confirmation checkbox for clear fields");
    else {
      ClearContens();
      sheet.getRange("ValidationMessage").setValue("Clearing fields completed");
    }
    range.uncheck();
    sheet.getRange("J14").uncheck();
  }
  //Calculate and Update Balance and History Tab
  if (
    range.getA1Notation() == "J16" &&
    range.isChecked() &&
    range.getSheet().getName() == "Worksheet"
  ) {
    var sheet = SpreadsheetApp.getActive().getSheetByName("Worksheet");
    sheet
      .getRange("ValidationMessage")
      .setValue("Updating Balance, Please wait..");

    if (sheet.getRange("J17").isChecked() == false)
      sheet
        .getRange("ValidationMessage")
        .setValue("Please tick the confirmation checkbox for updating balance");
    else {
      if (UpdateBalances())
        sheet.getRange("ValidationMessage").setValue("Balance updated");
    }
    range.uncheck();
    sheet.getRange("J17").uncheck();
  }
}
