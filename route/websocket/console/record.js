const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');
const {
    RecordCommand
} = require('../../../helper/RecordCommand');


//前端请求加载历史缓存
const HISTORY_SIZE_LINE = 1024;
const BASE_RECORD_DIR = "./core/RecordTmp/";

// BUG Note: 顺序应该是倒序，而不是正序。
WebSocketObserver().listener('server/console/history', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        let recordCommande = new RecordCommand(BASE_RECORD_DIR + serverName + ".log");
        let start = data.WsSession['record_start'] || 0;
        if (start <= HISTORY_SIZE_LINE) {
            response.wsSend(data.ws, 'server/console/history', 'terminalBack',
                "[控制面板]: 无法读取更多的服务端日志: 已到最顶端.. <br />");
            return;
        }
        // 从文件读取日志
        recordCommande.readRecord(start, HISTORY_SIZE_LINE, (resText) => {
            data.WsSession['record_start'] -= HISTORY_SIZE_LINE;
            // 替换为 HTML
            resText = resText.replace(/\n/gim, '<br />');
            console.log("指针:", data.WsSession['record_start'], "当前总大小:", recordCommande.recordLength())
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', resText);
        });
    }
});