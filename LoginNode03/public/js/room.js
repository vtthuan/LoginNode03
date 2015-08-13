﻿/**
 * Created by tan-thuan.vo on 24/06/2015.
 */
var selfEasyrtcid = "";
var haveSelfVideo = false;
var waitingForRoomList = true;
var isConnected = false;
var isJoinedRoom = false;
var AskCallMessage = "New member found. He wants to chat with you. Do you want to chat ?";
var AskQuitRoom = "Do you really want to quit room ? ";
var AskJoinRoom = "A partenaire was found. Do you want to chat with him?"

function disable(domId) {
    document.getElementById(domId).disabled = "disabled";
}

function enable(domId) {
    document.getElementById(domId).disabled = "";
}

function checkRoom(userName){
    if (easyrtc.myEasyrtcid == "") {
        connect(userName);
    }
    else {
        if (!isJoinedRoom)
            findRoom();
        else
            openDialog(AskQuitRoom, null, quitRoom, null);        
    }    
}

var partenaireFound = function (easyrtcid)
{
    alertify.confirm('Modal: false')
        .set('message', AskCallMessage)
        .set('modal', false)
        .set('onok', function () { acceptTheCall(easyrtcid); })
        .set('oncancel', function () { quitRoom(); })
        .autoCancel(30).show();
}
var acceptTheCall = function (easyrtcid) {
    performCall(easyrtcid);
    
};

//function acceptChecker(easyrtcid, callback) {
//    alertify.confirm('Modal: false')
//        .set('message', AskCallMessage)
//        .set('modal', false)
//        .set('onok', function () { acceptTheCall(true); })
//        .set('oncancel', function () { acceptTheCall(false); })
//        .autoCancel(30).show();

//    callerPending = easyrtcid;
//    var acceptTheCall = function (wasAccepted) {
        
//        if (easyrtc.getConnectionCount() > 0) {
//            alert("Drop current call and accept new from " + easyrtc.idToName(easyrtcid) + " ?");
//        }
//        else {
//            alert("Accept incoming call from " + easyrtc.idToName(easyrtcid) + " ?");
//        }
//        if (wasAccepted && easyrtc.getConnectionCount() > 0) {
//            easyrtc.hangupAll();
//        }
//        callback(wasAccepted);
//        callerPending = null;
//    };
//    //acceptTheCall();
//    callback(wasAccepted);
//    callerPending = null;
    
    
//}

function connect(userName) {
    easyrtc.setVideoDims(640, 480);
    easyrtc.setUsername(userName);
    easyrtc.setRoomEntryListener(roomEntryListener);
    easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.connect("CampusLanguage", loginSuccess, loginFailure);
    //easyrtc.setAcceptChecker(acceptChecker);
}

var isNewConnection = false;
function roomEntryListener(entry, roomName)
{
    isNewConnection = true;
    easyrtc.setRoomApiField(roomName, "isNewConnection", isNewConnection);
}

function occupantListener(roomName, occupants, selfInfo) {
    if (roomName === null) {
        return;
    }
    
    //only one person in room, not new anymore
    if (Object.keys(occupants).length > 1 || Object.keys(occupants).length === 0) {
        isNewConnection = false;
        easyrtc.setRoomApiField(roomName, "isNewConnection", false);
        return;
    }   
    
    //new connection doesn't contain field isNewConnection
    if (!isNewConnection && ( !occupants[0].apiField != undefined || occupants.valueOf(0).apiField.isNewConnection)) {
        partenaireFound(occupants.valueOf(0).easyrtcid);
    }
    
    //indique that the user is not new anymore
    if (selfInfo.apiField != undefined && selfInfo.apiField.isNewConnection.fieldValue)
        easyrtc.setRoomApiField(roomName, "isNewConnection", false);

    document.getElementById("numberPersons").innerHTML = "number persons : " + Object.keys(occupants).length + 1;
    
    //if (needToCallOtherUsers) {
    //    for (var id in occupants)
    //        performCall(id);
    //}
    

}

function setUpMirror() {
    if (!haveSelfVideo) {
        var selfVideo = document.getElementById("selfVideo");
        easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
        selfVideo.muted = true;
        haveSelfVideo = true;
    }
}

function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();
    var successCall = function () { alert('call success'); setUpMirror(); };
    var failureCall = function () { };
    easyrtc.call(otherEasyrtcid, successCall, failureCall);
}

function hangup() {
    easyrtc.hangupAll();
    disable("hangupButton");
}

function sendRequest(requestType, requestData, callbackFunction, errorFunction) {
    easyrtc.sendServerMessage(requestType, requestData, callbackFunction, errorFunction);
}

function openDialog(msg, easyrtcObject, confirmFunction, cancelFunction) {
    alertify.confirm('Modal: false')
        .set('message', msg)
        .set('modal', false)
        .set('onok', function () { confirmFunction(easyrtcObject); })
        .set('oncancel', cancelFunction)
        .autoCancel(30).show();
}

var joinRoom = function (roomData) {
    //already accept to join room, show waiting sign
    if (!roomData.isNew) {
        //do something de cho biet room chua full
    }
    
    //join room
    easyrtc.joinRoom(roomData.roomName, null,
        function () {
        
        document.getElementById("room").innerHTML = "User is waiting for a chat. His room name : " + roomData.roomName;        
        updatePresence();
        isJoinedRoom = true;
    },
        function (errorCode, errorText) {
        easyrtc.showError(errorCode, errorText);
    });
}

var askToJoin = function (roomData) {
    if (!roomData.isNew) {
        openDialog(AskJoinRoom, roomData, joinRoom, null);
    }
}

var quitRoom = function (idDialog) {
    sendRequest("leaveRoom", null , receiveResponse, null);
}

var receiveResponse = function (msgType, msgData) {
    switch (msgType) {
        case "findRoom":
            if (msgData.isNew)
                joinRoom(msgData);
            else {
                askToJoin(msgData);
            }
            break;
        case "leaveRoom":
            isJoinedRoom = false;
            findRoom();
            break;
    };
}

var currentShowState = 'chat';
var currentShowText = '';
function updatePresence() {
    easyrtc.updatePresence(currentShowState, currentShowText);
}

function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    updatePresence();
    document.getElementById("name").innerHTML = "number Id : " + selfEasyrtcid;
    isConnected = true;
    findRoom();
}

var findRoom = function ()
{
    sendRequest("findRoom", null , receiveResponse, null); 
}

easyrtc.setStreamAcceptor(function (easyrtcid, stream) {
    setUpMirror();
    var video = document.getElementById('callerVideo');
    easyrtc.setVideoObjectSrc(video, stream);
    enable("hangupButton");
});


easyrtc.setOnStreamClosed(function (easyrtcid) {
    easyrtc.setVideoObjectSrc(document.getElementById("callerVideo"), "");
    disable("hangupButton");
});


function disconnect() {
    easyrtc.disconnect();
    document.getElementById("userNameField").innerHTML = "logged out";
    enable("btnConnect");
    disable("btnDisconnect");
    easyrtc.clearMediaStream(document.getElementById('selfVideo'));
    easyrtc.setVideoObjectSrc(document.getElementById("selfVideo"), "");
    easyrtc.closeLocalMediaStream();
    easyrtc.setRoomOccupantListener(function () { });
}

function loginFailure(errorCode, message) {
    easyrtc.showError("LOGIN-FAILURE", message);
}