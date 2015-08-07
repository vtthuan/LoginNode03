/**
 * Created by tan-thuan.vo on 24/06/2015.
 */
var selfEasyrtcid = "";
var haveSelfVideo = false;
var waitingForRoomList = true;
var isConnected = false;
var AskCallMessage = "New member found. He wants to chat with you. Do you want to chat ?";

function disable(domId) {
    document.getElementById(domId).disabled = "disabled";
}

function enable(domId) {
    document.getElementById(domId).disabled = "";
}

function findRoom(userName){

}

function acceptChecker(easyrtcid, callback) {
    alertify.confirm('Modal: false')
        .set('message', AskCallMessage)
        .set('modal', false)
        .set('onok', function () { acceptTheCall(true); })
        .set('oncancel', function () { acceptTheCall(false); })
        .autoCancel(30).show();
    
    callerPending = easyrtcid;
    
    var acceptTheCall = function (wasAccepted) {
        
        if (easyrtc.getConnectionCount() > 0) {
            alert("Drop current call and accept new from " + easyrtc.idToName(easyrtcid) + " ?");
        }
        else {
            alert("Accept incoming call from " + easyrtc.idToName(easyrtcid) + " ?");
        }
        if (wasAccepted && easyrtc.getConnectionCount() > 0) {
            easyrtc.hangupAll();
        }
        callback(wasAccepted);
        callerPending = null;
    };
}

function connect(userName) {
    easyrtc.setVideoDims(640, 480);
    easyrtc.setUsername(userName);
    easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.connect("CampusLanguage", loginSuccess, loginFailure);
    easyrtc.setAcceptChecker(acceptChecker);
}

function occupantListener(roomName, occupants, selfInfo) {
    if (roomName === null) {
        return;
    }
    
    if (Object.keys(occupants).length > 1 || Object.keys(occupants).length === 0) {
        alert(Object.keys(occupants).length + "personnes");
        return; // trait the cas when a room has > 2 persones
    }
    
    
    var isLastOneJoin = true;
    for (aClient in occupants) {
        if (selfInfo.roomJoinTime < occupants[aClient].roomJoinTime)
            isLastOneJoin = false;
    }
    
    if (isLastOneJoin) {
        for (var id in occupants)
            performCall(id);
    }
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
    alert('calling');
    var successCB = function () { alert('call success'); setUpMirror(); };
    var failureCB = function () { };
    easyrtc.call(otherEasyrtcid, successCB, failureCB);
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
        //show a box which contain 2 red points for 2 personnes
        $(".waitingPanel").show("slow");
        $("#circle1").addClass("active");
    }
    
    //join room
    easyrtc.joinRoom(roomData.roomName, null,
        function () {
        
        document.getElementById("room").innerHTML = "User is waiting for a chat. His room name : " + roomData.roomName;
        
        updatePresence();
        

    },
        function (errorCode, errorText) {
        easyrtc.showError(errorCode, errorText);
    });
}

var askToJoin = function (roomData) {
    if (!roomData.isNew) {
        var msg = "A room is found. Do you want to join? "
        openDialog(msg, roomData, joinRoom, null);
    }
}

var quitRoom = function (idDialog) {
    //do something
}

function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
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
    }    ;
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