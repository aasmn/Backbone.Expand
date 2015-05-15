(function (Backbone, Expand, app) {
    function _destroyModel(model){
        if(model.get('active')){
            var index = model.collection.indexOf(model);
            model.collection.at(index-1).set("active",true);
        }
        model.destroy();
    };
    var FloatTab = Expand.View.extend({
        tagName: 'li',
        template: '<span></span><%=name%>',
        events: {
            'click': 'onActive'
        },
        render: function () {
            var tempfun = _.template(this.template);
            this.$el.append(tempfun(this.model.toJSON()));
            //this.listenTo(this.model,"change:name change:time",this.render);
            this.listenTo(this.model, "change:active", this.setActive);
            this.setActive(this.model, this.model.get("active"));
        },
        onActive: function () {
            this.trigger("active", this.model);
            this.model.set("active", true);
            //this.setActive(this.model,true);
        },
        setActive: function (model, active) {
            if (active) {
                this.$el.addClass("active");
            }
            else
                this.$el.removeClass("active");
        }

    });
    var FloatTabs = Expand.CollectionView.extend({
        childView: FloatTab,
        tagName: 'ul',
        className: 'pageul',
        childEvents: {
            'active': 'onChildActive'
        },
        onChildActive: function (child, model) {
            var active = this.collection.find(function (m) {
                return m.get('active') && m.cid !== model.cid;
            });
            if (active)
                active.set('active', false);
            this.trigger('tab-active', model);
        },
        setActiveByModel: function (model) {
            if (model) {
                model.set('active', true);
                this.onChildActive(null, model);
            }
        },
        setActiveByIndex: function (index) {
            var model = this.collection.at(index);
            if (model) {
                model.set('active', true);
                this.onChildActive(null, model);
            }
        }
    });
    var Tab = Expand.View.extend({
        template: ['<img class="mapicon" src="img/n_mapicon.png">',
                '<span class="mf">*</span>',
                '<span class="label" title=""></span>',
                '<span class="tab"></span>',
                '<span class="closeicon"><img src="img/n_tabclose_btn.png"></span>',
				'<div class="float-tabs" region="float"></div>'].join(''),
        tagName: 'li',
        events: {
            'click .closeicon': function () {
                this.trigger("close", this.model);
            },
            'click .tab': 'showTabs',
            'click ': 'onActive'
        },
        triggers: {
            'close': 'onClose'
        },
        initialize: function () {
            this.listenTo(this.model, 'change:name', this.renderName);
            this.listenTo(this.model, 'change:activetab', this.renderTab);
            this.listenTo(this.model, 'change:tabs', this.renderFloat);
            this.listenTo(this.model, 'change:active', this.setActive);
            this.listenTo(this.model, 'change:title', this.renderTitle);
            this.listenTo(this.model, 'change:modified', this.renderModify);
            this.listenTo(app, "clearFloat", this.clearFloat);
            this.listenTo(this.model, 'change:uncloseable', this.renderClose);
        },

        render: function () {
            this.$el.append(this.template);
            this.$(".label").text(this.model.get("name"));
            this.$("span").attr("title", this.model.get("title") || this.model.get("name"));
            if (this.model.get("uncloseable")) this.$(".closeicon").hide();
            if (this.model.get('active')) {
                this.setActive(null, true);

                var activemodel = this.model.collection.find(function (m) {
                    return m.get('active');
                });
                if (activemodel) activemodel.set('active', false);
                this.onActive();
            }
            if (this.model.get("modified")) {
                this.$(".mf").show();
            } else {
                this.$(".mf").hide();
            }

            if (this.model.get("tabIcon")) {
                this.$(".mapicon").show();
            } else {
                this.$(".mapicon").hide();

                if (this.model.attributes["url"] === "mapview.html") {
                    this.$(".mapicon").show();
                } else {
                    this.$(".mapicon").hide();
                }
            }
            if(this.model.get("type") === "img"){
                this.$(".mapicon").show();
                this.$('.mapicon').attr("src","img/n_visioicon.png");
            }

        },
        renderClose: function (model, uncloseable) {
            if (uncloseable) {
                this.$(".closeicon").hide();
            } else {
                this.$(".closeicon").show();
            }
        },
        renderName: function (model, name) {
            this.$(".label").text(name);
            if (!this.model.get("title"))
                this.$("span").attr("title", name);
        },
        renderTab: function (model, tab) {
            this.$('.tab').html("<img src='img/n_larger.png' style='margin-top: -2px;'/><img class='mapicon tabmapicon' src='img/n_pageicon.png' />" + tab);
            if (this.floatCollection) {
                var floatTag = this.floatCollection.find(function (m) {
                    return m.get("name") === tab;
                });
                if (floatTag) {
                    this.float.currentView.setActiveByModel(floatTag);
                }
            }
        },
        renderFloat: function (model, tabs) {
            var tabArr = _.map(tabs, function (tab) {
                return { name: tab, time: 'none' };
            });
            var collection = new Backbone.Collection(tabArr);
            this.floatCollection = collection;
            if (!this.float.currentView) {
                this.float.show(new FloatTabs({
                    collection: collection
                }));
                this.listenTo(this.float.currentView, 'tab-active', this.onActiveTab);
                var activeModel = collection.find(function (m) {
                    return m.get('name') === model.get('activetab');
                });
                if (activeModel)
                    this.float.currentView.setActiveByModel(activeModel);
                else
                    this.float.currentView.setActiveByIndex(0);

            } else {
                this.float.currentView.collection = collection;
            }
        },
        renderTitle: function (model, title) {
            this.$("span").attr("title", title);
        },
        renderModify: function (model, modified) {
            if (modified) {
                this.$(".mf").show();
            } else {
                this.$(".mf").hide();
            }
        },
        showTabs: function (e) {
            e.stopPropagation();
            var taboffset = this.$('.tab').offset();
            var left = taboffset.left;
            var top = taboffset.top + this.$('.tab').height();
            this.float.$el.css({ left: left + 16, top: top + 5 });
            this.float.$el.show();
        },
        clearFloat: function () {
            this.float.$el.hide();
        },
        onClose: function () {
            if (!this.model.get("modified")){
                _destroyModel(this.model);
            }else {
                //this.parentCt
                app.Widget.Choise({
                    title: 'Map Save',
                    body: 'The map "' + this.model.get("name") + '" has been modified, do you want to save it?',
                }, function (result) {
                    if (result) {
                        this.onActive();

                        var mapapp = this.model.get("frame")[0].contentWindow.Application;
                        mapapp.trigger("save");
                        var that = this;
                        this.listenTo(mapapp, "saveComplete", function () {
                            _destroyModel(that.model);
                        });
                    } else {
                        _destroyModel(this.model);
                    }
                }, this);

            }

        },
        onActiveTab: function (model) {
            this.model.set('activetab', model.get("name"));
            app.trigger('loadMap', this.model);
        },
        onActive: function () {
            //this.trigger("active",this.model);
            this.model.set("active", true);
        },
        setActive: function (model, active) {
            if (active)
                this.$el.addClass("active");
            else
                this.$el.removeClass("active");
            if (active)
                this.trigger("active", this.model);
        }

    });

    var PlusTab = app.view({
        template: '<span><img src="img/n_plus.png"></span>',
        //	tagName:'li',
        className: 'plus',
        events: {
            'click': 'clicked'
        },
        render: function () {
            this.$el.append(this.template);
        },
        clicked: function () {
            if (this.options.parentCt) {
                this.options.parentCt.trigger("addNew");
            }
        },
        pos: function (left) {
            this.$el.css({ left: left }).find("span").show();
        },
        showRight: function () {
            this.$el.css({ left: "auto", right: 43 }).find("span").show();
        },
        show: function () {
            this.$("span").show();
        },
        hide: function () {
            this.$("span").hide();
        }
    });
    var Tablist = Expand.CollectionView.extend({
        tagName: "ul",
        childEvents: {
            'active': 'onChildActive',
            'addNew': function () {
                if (this.parentCt)
                    this.parentCt.trigger("addNew");
            }
        },
        initialize: function (options) {
            this.parentCt = options.parentCt;
            this.listenTo(this.collection, "destroy", this.onChildDestroy);
        },
        onChildActive: function (child, model) {
            var active = this.collection.find(function (m) {
                return m.get('active') && m.cid != model.cid;
            });
            if (active)
                active.set('active', false);
            //this.trigger('tab-active',model);
        },
        onChildDestroy: function (model) {
            // if (model.get('active')) {
            //     var index = this.collection.indexOf(model);
            //     this.collection.at(index - 1).set('active', true);
            // }
            if (this.collection.length === 1)
                this.parentCt.trigger('empty', true);
        },
        setActiveByModel: function (model) {
            model.set('active', true);
            this.onChildActive(null, model);
        },
        getChildView: function (child) { // child is a model
            //if(child.get("fixedPlus"))
            //	return PlusTab;
            //else
            return Tab;
        },
        childViewOptions: function () {
            return { parentCt: this.parentCt };
        }
    });
    var TabContent = Expand.View.extend({
        tagName: 'iframe',
        initialize: function () {
            this.listenTo(this.model, "change:active", this.setActive);
        },
        render: function () {
            if (!this.model) return;
            if (this.model.get("url")) {
                var qstr = this.model.get("querry");
                if (qstr) {
                    qstr += "&cid=" + this.model.cid;
                } else {
                    qstr = "?cid=" + this.model.cid;
                }
                this.$el.attr("src", this.model.get("url") + qstr);
                this.model.set("frame", this.$el);
                var model = this.model;
                this.$el[0].onload = function () {
                    var callback = model.get("onLoad");
                    if (callback) {
                        _.defer(function() {
                           callback.apply(this, [model]);
                        });
                    }
                };
            }
            if (!this.model.get("active"))
                this.$el.hide();
        },
        setActive: function (model, active) {
            if (active) {
                this.$el.show();
            }
            else {
                this.$el.hide();
            }
        }

    });
    var ImgContent = Expand.View.extend({//<span class='download-icon'></span>
        template: ["<div class='download'>download</div>",
                   "<img src='#'/>"],
        className:'imgContent',
        events:{
            'click .download': function(){
                window.open(this.model.get("download"));
            }
        },
        initialize: function () {
            this.listenTo(this.model, "change:active", this.setActive);
        },
        render: function(){
            this.$el.append(this.template);
            var $el = this.$el;
            this.$('img').attr('src',this.model.get("img_src"));
            _.defer(function(){
                $el.css('line-height',$el.height()+"px");
            });
        },
        setActive: function (model, active) {
            if (active) {
                this.$el.show();
            }
            else {
                this.$el.hide();
            }
        }
    });

    var PathContent = Expand.View.extend({
        template:['<div class="path-west no-scrollbar"></div>',
                    '<div class="path-center">',
                        '<div class="layout-center" id="mapTabs"><iframe src=""></iframe></div>',
                        '<div class="layout-south">',
                            '<div class="layout-resizer"><div class="layout-toggler layout-toggler-open"></div></div>',
                            '<div class="deviceInfoTabs"></div>',
                        '</div>',
                    '</div>'],
        className:'pathContent',
        events:{
            'click .layout-toggler': function(e){
                var el = $(e.target);
                if(el.hasClass('layout-toggler-open')){
                    //this.$('.layout-south').css("top", this.$('.layout-south').parent().height()-30 - this.$('.layout-center').height()); 
                    this.$('.layout-center').height(this.$el.height()-30);
                    this.$('.layout-south').height(30);    
                    el.removeClass('layout-toggler-open');
                    el.addClass('layout-toggler-closed');
                }else{
                    //this.$('.layout-south').css("top", this.$('.layout-south').parent().height()-310 - this.$('.layout-center').height());  
                    this.$('.layout-center').height(this.$el.height()-310);
                    this.$('.layout-south').height(310);     
                    el.removeClass('layout-toggler-closed');
                    el.addClass('layout-toggler-open');    
                    this.$('.ui-layout-content').height(252);
                }
                //this.onResize.call(this);
            }
        },
        initialize: function () {
            this.listenTo(this.model, "change:active", this.setActive);
            this.listenTo(this.model, 'startCalcPath', this.startCalcPath);
            this.listenTo(this.model, 'stopCalcPath', this.stopCalcPath);
            this.listenTo(this.model, 'selectDevice', this.selectDevice);
        },
        setActive: function (model, active) {
            if (active) {
                this.$el.show();
            }
            else {
                this.$el.hide();
            }
        },
        triggers: {
            "updateMapModel": "onupdateMapModel"
        },
        getExecutingLogTimerId: null,
        identityKey: "",
        recvLogIndex: -1,
        calculateSessionId: "",
        calcParam: null,
        exeutionLogTimespan: 3000,

        render: function(){
            var model = this.model;
            this.$el.append(this.template.join(''));
            this.$('iframe').attr('src','mapview.html?type=path&cid='+this.model.cid);
            model.set("frame", this.$('iframe'));


            this.initPageByConfig();

            this.$('iframe')[0].onload = function () {
                var callback = model.get("onLoad");
                if (callback) {
                    _.defer(function() {
                       callback.apply(this, [model]);
                    });
                }
            };
            var that = this;
            this.$('.layout-south').resizable({
                handles: "n",
                 delay: 150,
                start:function(event, ui){
                    that.stopListening(app,'app:resize');
                    var markleft = app.markleft.$el;
                    markleft.show();
                },
                stop: function(){
                    app.markleft.$el.hide();
                    that.listenTo(app,'app:resize',that.onResize);
                    that.onResize.call(that);
                },
            });
        },
        initPageByConfig: function () {
            var that = this;
            ServerAPI.GetPathConfig().done(function (jsonData) {
                var data = jsonData.d;
                if (Utils.IsSuccess(data)) {
                    that.exeutionLogTimespan = data.ExecutionLogTimespan * 1000;
                    that.initPage();
                } else {
                    alert(data.ActionStatus.ErrMsg);
                }
            }).fail(function (ex) {
                Utils.alertAjaxError.apply(Utils, arguments);
            });
        },
        initPage: function () {
            this.panelViewModel = new Backbone.Model({
                modelo: new app.PanelItemModel({
                    id: "modelo",
                    Direction: "icon-left",
                }),
                modelp: new app.PanelItemModel({
                    id: "modelp",
                    Direction: "icon-right"
                })
            });

            this.paneView = new app.PanelView({ model: this.panelViewModel });
            $(".path-west").append(this.paneView.el);

            //this.mapModel = new Backbone.Model({ id: "mapDiv", type: "", show: true });
            
            //this.mapView.trigger("hideMapBar");
            //this.trigger("updateMapModel", { createMap: true });

            this.executionLogModel = new Backbone.Model();
            var pathLogView = new app.PathLogView({ el: this.$(".deviceInfoTabs"), model: new Backbone.Model({ executionLogModel: this.executionLogModel }) });
            this.paneView.show();
            this.$('.layout-center').height(this.$el.height()-310);

            var dir = GetQueryString("pathdirection");
            if (dir == 2) {
                this.paneView.hideItem(1);
            } else if (dir == 3) {
                this.paneView.hideItem(0);
            }
        },
        onResize: function () {
            var that = this;
            var top =parseInt(that.$('.layout-south').css('top'))||0;
            if(top !== 0){
                that.$('.layout-south').css('top',0);
            }
            that.$('.layout-south').height($(window).height-that.$('.layout-south').offset().top);
            var th = $(window).height() - 80 - that.$('.layout-south').height();
            that.$('.layout-center').height(th-1);
            that.$('.ui-layout-content').height(that.$('.layout-south').height()-58);

        },
        selectDevice: function (deviceName) {
            this.mapView.selectDevice(deviceName);
        },
        onupdateMapModel: function (data) {
            var model = this.mapModel;

            if (_.has(data,"jMapData")) {
                model.set("jMapData", data.jMapData);
            }
            if (_.has(data,"createMap")) {
                model.set("createMap", data.createMap);
            }
            if (_.has(data,"clearMap")) {
                model.set("clearMap", data.clearMap);
            }
            if (_.has(data, "createMapCompleted")) {
                model.set("createMapCompleted", data.createMapCompleted);
               this.model.set("uncloseable", false);
            }
        },
        updatePanelModel: function (data, dir) {
            if (!dir) {
                this.updatePanelModel(data, "o");
                this.updatePanelModel(data, "p");
            }

            var model = this.panelViewModel.get(dir == "o" ? "modelo" : "modelp");
            if (!model) {
                return;
            }

            if (_.has(data, "SourceIp")) {
                model.set("SourceIp", data.SourceIp);
            }

            if (_.has(data, "DestinationIp")) {
                model.set("DestinationIp", data.DestinationIp);
            }

            if (_.has(data, "Status")) {
                model.set("Status", data.Status);
            }

            if (_.has(data, "DeviceInfos")) {
                model.set("DeviceInfos", data.DeviceInfos);
            }
            if (_.has(data, "PathCalcIsCompleted")) {
                model.set("PathCalcIsCompleted", data.PathCalcIsCompleted);
            }
        },
        showFirtDeviceMap: function(firstIp) {
            this.mapView.trigger('addDeviceByIp', firstIp);
        },
        startCalcPath: function (opts) {
            this.identityKey = opts.identityKey;
            this.calcParam = opts.calcParam;
            this.calculateSessionId = opts.calculateSessionId;

            this.mapView = this.model.get("frame")[0].contentWindow.Application.maps.currentView;
            this.mapModel = this.mapView.collection.at(0);
            this.trigger("updateMapModel", { createMap: true });
            this.updatePanelModel({
                SourceIp: this.calcParam.SourceAddress,
                DestinationIp: this.calcParam.DestinationAddress
            });

            this.requestExecutingLog();
            this.showFirtDeviceMap(opts.firstIp);
            //this.showProgressbar();
        },
        stopCalcPath: function() {
            this.clearRequestExecutingLog();
            this.pathCalculateCompleted();
        },
        pathCalculateCompleted: function() {
            this.mapView.trigger("showMapBar");
            this.trigger("updateMapModel", { createMapCompleted: true });
            this.updatePanelModel({ PathCalcIsCompleted: true });
            app.path.currentView.initPathButton();
        },
        clearRequestExecutingLog: function() {
            clearTimeout(this.getExecutingLogTimerId);
        },
        showProgressbar: function () {
            var progressbarModel = new Backbone.Model({ value: 5});
            this.progressbarView = new app.ProgressbarView({ className: "progressbar", model: progressbarModel });
            $("#mapTabs").append(this.progressbarView.el);
            this.progressbarView.run();
        },
        getHopDevicesInfo: function() {
            var that = this;
            ServerAPI.GetRoutingPath({ identityKey: this.identityKey }).done(function(jsonData) {
                var data = jsonData.d;
                if (Utils.IsSuccess(data)) {
                    that.showRoutingPath(data.RoutingPathList);
                    if (data.PathCalcIsCompleted) {
                        that.pathCalculateCompleted();
                    }
                } else {
                    alert(data.ActionStatus.ErrMsg);
                    that.stopCalcPath();
                }
            }).fail(function(ex) {
                //Utils.alertAjaxError.apply(Utils, arguments);
            });
        },
        getExecutingLog: function () {
            var that = this;
            ServerAPI.GetExecutingLog2({ identityKey: this.identityKey,calculateSessionId: this.calculateSessionId, recvLogIndex: this.recvLogIndex}).done(function (jsonData) {
                var data = jsonData.d;
                if (Utils.IsSuccess(data)) {
                    that.recvLogIndex = data.RecvLogIndex;
                    that.executionLogModel.set({ LogContent: data.LogContent });
                    if (data.HaveDeviceHopInfo) {
                        that.getHopDevicesInfo();
                    }

                    if (data.IsCompleted) { //path计算完成
                        that.clearRequestExecutingLog();
                    } else {
                        that.requestExecutingLog();
                    }
                    
                } else {
                    that.alertError(data);
                    that.stopCalcPath();
                    return;
                }
                //   that.progressbarView.next();
            }).fail(function (ex) {
                that.requestExecutingLog();
                //Utils.alertAjaxError.apply(Utils, arguments);
            });
        },
        requestExecutingLog: function () {
            var that = this;
            this.getExecutingLogTimerId = setTimeout(function() {
                    that.getExecutingLog();
                },
                this.exeutionLogTimespan);
        },
        getDeivceInfoData: function (list) {
            var ref = [];
            _.each(list, function (deviceInfo) {
                //if (deviceInfo.InOut && deviceInfo.InOut.length) {
                    var arr = [];
                    _.each(deviceInfo.InOut, function (data) {
                        arr.push({ InOutType: data.InterfaceType == 1 ? "In" : "Out", DeviceInterface: data.InterfaceName, Alg: data.Alg });
                    });
                    ref.push({ DeviceName: deviceInfo.DeviceName, DeviceTypeName: deviceInfo.DeviceTypeName, InOut: arr });
               // }
            });

            return ref;
        },
        showRoutingPath: function (list) {
            var that = this;
            _.each(list, function (item) {

                var dir = (that.calcParam.SourceAddress == item.SrcIp && that.calcParam.DestinationAddress == item.DestIp) ? "p" : "o";
                that.updatePanelModel({
      //              SourceIp: item.SrcIp,
        //            DestinationIp: item.DestIp,
                    Status: item.IsCalcSucceed,
                    DeviceInfos: that.getDeivceInfoData(item.RoutingHopList)
                }, dir);

                that.trigger("updateMapModel", { jMapData: item.JMapJsonContext });
            });

        },
        alertError: function (data) {
            alert(data.ActionStatus.ErrMsg);
        }
    });



    var TabContentList = Expand.CollectionView.extend({
        getChildView: function(child){ // child is a model
            if(child.get('type') === "img"){
                return ImgContent;
            }
            if(child.get('type') === "path"){
                return PathContent;
            }
            return TabContent;
        }
    });


    var SwitchTabPanelItem = Expand.View.extend({
        tagName: 'li',
        template: '<span></span><%=name%>',
        events: {
            'click': 'onActive'
        },
        initialize: function () {
            this.listenTo(this.model, 'change:name', this.renderName);
            this.listenTo(this.model, 'change:active', this.setActive);
        },
        render: function () {
            var tempfun = _.template(this.template);
            this.$el.append(tempfun(this.model.toJSON()));

            this.setActive(this.model, this.model.get("active"));
        },
        renderName: function (model, name) {
            if (name) {
                this.$el.html("<span></span>" + name);
            }
        },
        onActive: function () {
            this.model.set("active", true);
            this.trigger("active");
        },
        setActive: function (model, active) {
            if (active) {
                this.$el.addClass("active");
            } else {
                this.$el.removeClass("active");
            }
        }
    });

    var SwitchTabPanel = Expand.CollectionView.extend({
        childView: SwitchTabPanelItem,
        tagName: 'ul',
        className: 'pageul',
        childEvents: {
            'active': 'onChildActive'
        },
        onChildActive: function (child) {
            this.trigger("active", child.model.cid);
        },
    });

    var SwitchTab = app.view({
        template: '<span class="switch-button"></span><div class="float-tabs" region="switchTabPanel"></div>',
        //tagName: 'li',
        //    className: 'switchtab',
        events: {
            'click': 'clicked'
        },
        initialize: function () {
            this.listenTo(app, "clearFloat", this.clearFloat);
        },
        render: function () {
            this.$el.append(this.template);
        },
        onShow: function () {
            this.switchTabPanel.show(new SwitchTabPanel({ collection: this.options.collection }));
        },
        clearFloat: function () {
            this.switchTabPanel.$el.hide();
        },
        clicked: function (e) {
            e.stopPropagation();
            var offset = this.$el.offset();
            this.switchTabPanel.$el.css({ right: 8, top: offset.top + 25 });
            this.switchTabPanel.$el.show();
        },
        show: function() {
            this.$("span").css({ display: "inline-block" });
        },
        hide: function () {
            this.$("span").hide();
        }
    });

    var ui = Expand.View.extend({
        template: '<div region="switchTab" class="switchtab"></div><div region="tabs"></div><div region="contents"></div>',
        render: function () {
            this.$el.append(this.template);
        },
        triggers: {
            'addTab': 'onAddTab',
            'resize': 'onResize',
            'configTab': 'onConfigTab',
            'Modified': 'onModified',
            'modifyName': 'onModifyname',
            'closeTab': 'onCloseTab',
            'MapDelete': 'onMapDelete'
        },
        className: "widget-Tag",
        initialize: function (options) {
            options = options || {};
            this.fixed = options.fixed;
            this.listenTo(app, "resize", this.onResize);
        },
        tabConnectionEvent: function () {
            var that = this;
            this.listenTo(this.tablist, 'all', function(event,model) {
                that.resizeTab();
                // console.log("all," + model + "v2:" + v2);

                _.delay(function() {
                    that.onswitchTabActive(model.cid);
                }, 100);
            });

            this.listenTo(this.switchTabView.switchTabPanel.currentView, "active", this.onswitchTabActive);
        },
        onswitchTabActive: function (cid) {
            //var childOffset = child.$el.offset();
            var c = _.find(this.tabs.currentView.children, function(v) {
                return v.model.cid == cid;
            });
            if(!c) return;
            var childOffsetLeft = c.$el.offset().left - this.$el.offset().left;
            var tabWidth = this.$el.parent().width() - 75;

            if (childOffsetLeft > 0 && childOffsetLeft + c.$el.width() + 9 > tabWidth) {
                var left = c.$el.offset().left - c.$el.parent().offset().left;
                this.tabs.$el.scrollLeft(left - tabWidth + c.$el.width() + 9);
            }

            if (childOffsetLeft < 0) {
                this.tabs.$el.scrollLeft(this.tabs.$el.scrollLeft() + childOffsetLeft-8);
            }
        },
        resizeTab: function () {

            var that = this;

            var tabWidth = that.$el.parent().width() - 75;
            that.plusTabView.hide();
            _.delay(function () {
                var last = that.tabs.$el.find(">ul>li:last");
                var lastRight = last.offset().left + last.width() + 1;
                var curWidth = lastRight - that.tabs.$el.find(">ul").offset().left;
                if (curWidth >= tabWidth) {
                    that.plusTabView.showRight();
                    that.switchTabView.show();
                } else {
                    that.plusTabView.pos(lastRight);
                    that.switchTabView.hide();
                }
            }, 0);
        },
        onShow: function () {
            this.tablist = new Backbone.Collection();

            this.tabs.show(new Tablist({
                collection: this.tablist,
                parentCt: this
            }));

            if (this.fixed) {
                this.plusTabView = new PlusTab({ parentCt: this });
                this.tabs.$el.append(this.plusTabView.el);
            }

            this.switchTabView = new SwitchTab({
                el: this.switchTab.el,
                collection: this.tablist
            });
            this.switchTab.show(this.switchTabView);

            this.tabConnectionEvent();

            this.cntlist = new Backbone.Collection();
            this.contents.show(new TabContentList({
                el: this.contents.el,
                collection: this.cntlist,
                parentCt: this
            }));

            this.trigger('resize');
            this.listenTo(app, "app:resize", this.onResize);
        },
        onAddTab: function (options) {
            options = new Backbone.Model(options);

            if (options.get("key")) {
                var model = this.cntlist.find(function (m) {
                    return m.get("key") === options.get("key");
                });
                if (model) {
                    var activepage = (options.get("querry") || "").match(/\activepage=[^&]*/g);
                    if (activepage && activepage.length > 0)
                        model.set("activetab", activepage[0].replace("activepage=", ""));
                    model.set('active', true);
                    return;
                }
            }
            if (this.fixed)
                //this.tablist.add(options,{at:-2});
                this.tablist.add(options, { at: -1 });
            else
                this.tablist.add(options);
            this.cntlist.add(options);

            return options;
        },
        onResize: function () {
            var that = this;
            _.delay(function () {
                var totalhgt = that.$el.parent().height();
                that.contents.$el.height(totalhgt - that.tabs.$el.height());

                that.switchTabView.$('div[region="switchTabPanel"]').css({ "max-height": that.contents.$el.height() * 0.75 });

            }, 200);

            this.resizeTab();
        },
        onConfigTab: function (id, data, isActive) {
            var mapid = data.QmapId || 0;
            var model;
            model = this.tablist.get(id);
            if (data.Name)
                model.set("name", data.Name);
            if (!data.JmapPageName) return;
            var activetab = data.AcitvePageName;
            if (!activetab) activetab = data.JmapPageName[0];
            model.set({
                tabs: data.JmapPageName,
                activetab: activetab,
                qmapId: mapid
            });
            //model.set('key',data.QmapId);
            if (isActive)
                model.set('active', true);
            this.trigger("ConfigTabed");
        },
        getCurrentTab: function () {
            return this.cntlist.find(function (m) {
                return m.get("active") === true;
            });
        },
        getCurrentFrame: function () {
            var model = this.cntlist.find(function (m) {
                return m.get("active") === true;
            });
            return model.get("frame");
        },
        onModified: function (modified) {
            var model = this.cntlist.find(function (m) {
                return m.get("active") === true;
            });
            if (model) {
                model.set("modified", modified);
            }
        },
        onModifyname: function (cid, mapid, mapname) {
            var model = this.tablist.get(cid);
            if (model) {
                model.set("key", "?jmapid=" + mapid);
                model.set("name", mapname);
                model.set("qmapId",mapid);
            }
        },
        onCloseTab: function (cid) {
            var model = this.tablist.get(cid);
            if (model)
                _destroyModel(model);
        },
        onMapDelete: function(rst,mapid) {
            if(!rst) return;
            var model = this.cntlist.find(function(m){
                return m.get("qmapId") == mapid
            });
            if(model){
                _destroyModel(model);
            }
        }
    });
    app.Widget.Tabs = ui;
})(Backbone, Backbone.Expand, Application);