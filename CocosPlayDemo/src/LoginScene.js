/**
 * Created by encal on 15/11/25.
 */

var LoginScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new LoginLayer();
        this.addChild(layer);
    }
});

var LoginLayer = cc.Layer.extend({
    sigInfo : null,
    buttonLayer : null,

    ctor: function () {
        this._super();
    },

    onEnter: function () {
        this._super();
        var winSize = cc.winSize;

        this.buttonLayer = new cc.Layer();
        this.addChild(this.buttonLayer);

        // title label
        var titleLabel = new cc.LabelTTF("LoginTest", "Arial", 38);
        titleLabel.setPosition(winSize.width/2, winSize.height/2 + 200);
        this.addChild(titleLabel, 5);

        var self = this;
        pluginManager.initAnySDK(function (isSucceed) {
            if (isSucceed) {
                /*
                 * - 用户插件初始化成功后，根据不同的渠道环境，采取不同的登录策略
                 * 1. QQ 浏览器尝试自动登录，失败后显示登录按钮
                 * 2. QQ 大厅使用之前登录过的信息直接登录
                 * 3. 其他渠道正常显示登录按钮
                 * */
                switch (g_env) {
                    case CocosRuntimeEnv.TENCENT:
                        self.qqLogin();
                        break;
                    case CocosRuntimeEnv.QQGAME:
                        // QQ大厅直接登录
                        self.anysdkLogin();
                        break;
                    default :
                        // 显示登录按钮，让用户授权登录
                        self.showLoginMenu();
                        break;
                }
            } else {
                Utils.showToast("AnySDK初始化失败");
            }
        });
    },

    loginCallback: function (code, msg) {
        CocosPlay.log("on user result action.");
        CocosPlay.log("code: " + code);
        CocosPlay.log("msg: " + msg);

        switch (code) {
            case anysdk.UserActionResultCode.kLoginSuccess:
                Utils.showToast("登录成功");
                if (g_env === CocosRuntimeEnv.TENCENT) {
                    var msgObj = JSON.parse(msg);
                    pluginManager.x5_setToken({
                        "qbopenid": msgObj["qbopenid"],
                        "refreshToken": msgObj["refreshToken"],
                        "loginType": msgObj["loginType"],
                        "nickName": msgObj["nickName"]
                    });
                    // todo: 由于腾讯只有在登录的时候会返回用户信息，在refreshtoken的时候是不会返回用户信息的，所以登录完成的时候需要保存用户信息
                    cc.sys.localStorage.setItem("userInfo", msg);

                    CocosPlay.log(cc.sys.localStorage.getItem("userInfo"));
                    CocosPlay.log("User Info ==== " + pluginManager.getUserInfo());
                }
                // 获取用户信息
                if (pluginManager.isFunctionSupported("getUserInfo")) {
                    pluginManager.getUserInfo(this.loginCallback.bind(this));
                } else {
                    var userId = pluginManager.getUserID();
                    CocosPlay.log("userID :" + userId);
                    // 获取用户信息成功，进入游戏
                    this.showGameEntry();
                }
                break;
            case anysdk.UserActionResultCode.kLoginFail:
                Utils.showToast("登录失败");
                break;
            case anysdk.UserActionResultCode.kLoginCancel:
                Utils.showToast("登录被取消");
                break;
            case anysdk.UserActionResultCode.kLoginNetworkError:
                Utils.showToast("登录网络错误");
                break;
            case anysdk.UserActionResultCode.kGetUserInfoSuccess:
                Utils.showToast("获取用户数据成功");
                var msgObj = JSON.parse(msg);
                cc.sys.localStorage.setItem("userInfo", msg);
                CocosPlay.log("userInfo :" + msg);
                // 获取用户信息成功，进入游戏
                this.showGameEntry();
                break;
            case anysdk.UserActionResultCode.kGetUserInfoFail:
                Utils.showToast("获取用户数据失败");
                break;
            case anysdk.UserActionResultCode.kLogoutSuccess:
                Utils.showToast("注销成功");
                this.showLoginMenu();
                break;
            case anysdk.UserActionResultCode.kLogoutFail:
                Utils.showToast("注销失败");
                this.showLoginMenu();
                break;
            default :
                Utils.showToast("未知返回码: " + code);
        }
    },

    anysdkLogin: function () {
        pluginManager.login(this.loginCallback.bind(this));
    },

    qqLogin: function () {
        pluginManager.setLoginType("qq");
        pluginManager.login(this.loginCallback.bind(this));
    },

    wechatLogin: function () {
        pluginManager.setLoginType("wx");
        pluginManager.login(this.loginCallback.bind(this));
    },

    guestLogin: function () {
        pluginManager.setLoginType("guest");
        pluginManager.login(this.loginCallback.bind(this));
    },

    showLoginMenu: function () {
        this.buttonLayer.removeAllChildren();
        var loginItemList = [];
        var winSize = cc.winSize;
        var self = this;
        var initLoginItemList = function() {
            var exitLabel = new cc.LabelTTF("退出", "Arial", 38);
            var exitItem = new cc.MenuItemLabel(exitLabel, self.exitGame, self);
            loginItemList.push(exitItem);

            CocosPlay.log(loginItemList);
            var menu = new cc.Menu(loginItemList);
            menu.attr({
                x : winSize.width/2,
                y : winSize.height/2,
            });
            menu.alignItemsVerticallyWithPadding(10);
            self.buttonLayer.addChild(menu);
        };
        switch (g_env) {
            case CocosRuntimeEnv.ANYSDK:
                if (pluginManager.isFunctionSupported("getAvailableLoginType")) {
                    pluginManager.getAvailableLoginType({}, function (code, msg) {
                        if (code === anysdk.UserActionResultCode.kGetAvailableLoginTypeSuccess) {
                            Utils.showToast("获取可登录类型成功");
                            var msgObj = JSON.parse(msg);
                            var result = msgObj["result"];
                            if (result === 0) {
                                var loginTypes = msgObj["loginTypes"];
                                for (var pos in loginTypes) {
                                    if (loginTypes[pos]["loginType"] == "qq") {
                                        var qqLoginLabel = new cc.LabelTTF("QQ登录", "Arial", 38);
                                        var qqLoginItem = new cc.MenuItemLabel(qqLoginLabel, self.qqLogin, self);
                                        loginItemList.push(qqLoginItem);
                                    } else if (loginTypes[pos]["loginType"] == "wx") {
                                        var wechatLoginLabel = new cc.LabelTTF("微信登录", "Arial", 38);
                                        var wechatLoginItem = new cc.MenuItemLabel(wechatLoginLabel, self.wechatLogin, self);
                                        loginItemList.push(wechatLoginItem);
                                    } else if (loginTypes[pos]["loginType"] == "guest") {
                                        var guestLoginLabel = new cc.LabelTTF("游客登录", "Arial", 38);
                                        var guestLoginItem = new cc.MenuItemLabel(guestLoginLabel, self.guestLogin, self);
                                        loginItemList.push(guestLoginItem);
                                    } else {
                                        CocosPlay.log("未知的登录类型：" + loginTypes[pos]["loginType"]);
                                    }
                                }
                            } else {
                                var anySDKLoginLabel = new cc.LabelTTF("登录", "Arial", 38);
                                var anySDKLoginItem = new cc.MenuItemLabel(anySDKLoginLabel, self.anysdkLogin, self);
                                loginItemList.push(anySDKLoginItem);
                            }
                            initLoginItemList();
                        } else if (code === anysdk.UserActionResultCode.kGetAvailableLoginTypeFail) {
                            Utils.showToast("获取可登录类型失败");
                        } else {
                            Utils.showToast("未知错误，错误码" + code);
                        }
                    });
                } else {
                    var anySDKLoginLabel = new cc.LabelTTF("登录", "Arial", 38);
                    var anySDKLoginItem = new cc.MenuItemLabel(anySDKLoginLabel, this.anysdkLogin, this);
                    loginItemList.push(anySDKLoginItem);
                    initLoginItemList();
                }
                break;
        }
    },

    // 退出游戏
    exitGame: function () {
        switch (g_env) {
            case CocosRuntimeEnv.LIEBAO:
            case CocosRuntimeEnv.BAIDU:
                CocosPlay.log("this channel not allow game exit");
                break;
            default :
                cc.director.end();
                break;
        }
    },

    // 登录成功后，显示进入游戏按钮
    showGameEntry: function () {
        this.buttonLayer.removeAllChildren();
        var winSize = cc.winSize;
        var gameEntryLabel = new cc.LabelTTF("进入游戏", "Arial", 38);
        var gameEntryItem = new cc.MenuItemLabel(gameEntryLabel, function() {
            cc.director.runScene(new GameScene());

            /**预加载 - 因为demo所用资源较少，因此暂时注释掉
            * 定制preload界面样式
            * 最简单的定制方法就是替换res_engine中的资源，保持文件名与图片大小不变
            * 如果要自行定制，请参考以下 cc.LoaderLayer.setConfig 的写法
            * 以下为cc.LoaderLayer.setConfig的完整写法，如果不需要改变某个对象的属性值，可以置为null或不写，Cocos Play会自动为其设置一个默认值
            **/
            //cc.LoaderLayer.setConfig({
            //    background: {//背景图片
            //        res: "res_engine/preload_bg.jpg"//使用自定义背景图时，CP请使用与游戏设计分辨率大小一致的图片
            //    },
            //    title: {//标题
            //        show: true,//是否显示标题
            //        res: "res_engine/preload_title.png",//标题的资源
            //        position: null,//标题在整个layer中的位置 e.g.  cc.p(100,100);
            //        action: null//标题执行的action e.g.  cc.moveTo(1, cc.p(200,200))
            //    },
            //    logo: {
            //        res: "res_engine/preload_logo.png",
            //        show: true,
            //        position: null,
            //        action: null
            //    },
            //    progressBar: {//进度条
            //        show: true,
            //        res: "res_engine/progress_bar.png",//progressBar 图片
            //        offset: null,//loadingbar偏移loadingbar背景的offset  e.g.  cc.p(50,50)
            //        position: null,
            //        barBackgroundRes: "res_engine/progress_bg.png",//progressBar 背景图片
            //        barPoint: "res_engine/progress_light.png",//途中闪光点的图片
            //    },
            //    tips: {
            //        color: null,//提示文字颜色 e.g. cc.color(0, 255, 0),默认为白色
            //        show: true,
            //        fontSize: 22,//提示语的文字大小
            //        position: null,
            //        tipsProgress: function (status, loaderlayer) {//进度条更新的回调
            //            var statusStr = "runtime正在";
            //            if (status.stage == cc.network.preloadstatus.DOWNLOAD) {
            //                statusStr += "下载";
            //            } else if (status.stage == cc.network.preloadstatus.UNZIP) {
            //                statusStr += "解压";
            //            }
            //            if (status.groupName) {
            //                statusStr += status.groupName;
            //            }
            //            statusStr += " 进度:" + status.percent.toFixed(2) + "%";
            //            loaderlayer.getTipsLabel().setString(statusStr);//设置提示语文字
            //        }
            //    },
            //    onEnter: function (layer) {
            //        cc.log("LoaderLayer onEnter");//onEnter生命周期的时候调用
            //    },
            //    onExit: function (layer) {
            //        cc.log("LoaderLayer onExit");//onExit生命周期的时候调用
            //    }
            //});
            ////preload resources
            //cc.LoaderLayer.setUseDefaultSource(false);//false-不使用默认资源
            //cc.LoaderLayer.preload(["groupName"], function () {
            //    cc.log("preload resource finished!");
            //    cc.director.runScene(new GameScene());
            //});

        }, this);

        var logoutLabel = new cc.LabelTTF("退出登录", "Arial", 38);
        var logoutItem = new cc.MenuItemLabel(logoutLabel, this.logout, this);

        var gameEntryMenu;
        switch (g_env) {
            case CocosRuntimeEnv.TENCENT:
                gameEntryMenu = new cc.Menu(gameEntryItem, logoutItem);
                break;
            default :
                gameEntryMenu = new cc.Menu(gameEntryItem);
                break;
        }

        gameEntryMenu.attr({
            x : winSize.width/2,
            y : winSize.height/2,
        });
        gameEntryMenu.alignItemsVerticallyWithPadding(10);
        this.buttonLayer.addChild(gameEntryMenu);
    },

    // 登出
    logout: function () {
        CocosPlay.log("logout");
        pluginManager.logout(this.loginCallback.bind(this));
    }

});

var registerKeyEvent = function () {
    CocosPlay.log("registerKeyEvent");
    cc.eventManager.addListener(cc.EventListener.create({
        event: cc.EventListener.KEYBOARD,
        onKeyReleased: function (keyCode, event) {
            if (cc.sys.isNative) {
                cc.Dialog.show("确定退出游戏吗？", function (dialog) {
                    cc.director.end();
                }, function (dialog) {
                    cc.log("取消退出游戏");
                });
            }
        }
    }), -1);
};
registerKeyEvent();