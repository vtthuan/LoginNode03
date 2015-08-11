
function generateUUID() {
    return Math.random().toString(36).substr(2, 9);
};

module.exports = function (easyrtc) {
    easyrtc.events.on("easyrtcMsg", 
    function (connectionObj, msg, socketCallback, next) {
        switch (msg.msgType) {
            case "findRoom":
                connectionObj.getApp().getRoomNames(function (err, roomNames) {
                    var notFound = roomNames.every(function (element) {
                        connectionObj.getApp().getRoomOccupantCount(element, function (err, number) {
                            if (number < 2) {
                                socketCallback({ msgType: "findRoom", msgData : { "roomName"  : element, "isNew" : false } });
                                return false;
                            }
                        });
                    });
                    if (notFound) {
                        socketCallback({ msgType: "findRoom", msgData : { "roomName" : generateUUID(), "isNew" : true } });
                    }
                });
                next(null);
                break;

            case "leaveRoom":
                connectionObj.leaveRoom();
                next(null);
                break;

            default:
                easyrtc.events.emitDefault("easyrtcMsg", connectionObj, msg, socketCallback, next);
                break;
        }
        easyrtc.events.emitDefault("easyrtcMsg", connectionObj, msg, socketCallback, next);
    });
    
    easyrtc.setOption("roomDefaultEnable", false);

    
}