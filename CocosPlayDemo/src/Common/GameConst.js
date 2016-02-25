/**
 * Created by encal on 15/11/25.
 */

var GAME_SERVER_ADDRESS = "http://tencent.cocosruntime.com:5555"
//GAME_SERVER_ADDRESS = "http://192.168.31.166:5555"

var CocosRuntimeEnv = {
    TENCENT : 100115,   //QQ浏览器
    BAIDU   : 100117,   //百度浏览器
    LIEBAO  : 100125,   //猎豹浏览器
    WANBA   : 100206,   //玩吧
    QQGAME  : 100217,   //QQ游戏大厅
    ANYSDK  : 888888    //其他AnySDK+服务端模式的渠道
};

var g_env = CocosRuntimeEnv.ANYSDK;

var LoginActionType = {
    DIRECT  : 100,
    QQ      : 101,
    WECHAT  : 102,
    BAIDU   : 103,
    LIEBAO  : 104,
    WANBA   : 105,
    LOGOUT  : 106
};

var ItemListType = {
    PAY     : 100,
    FRIENDS : 101
};
