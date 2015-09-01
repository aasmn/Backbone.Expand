;(function(Backbone,Expand){
    var app = window.Application = _.extend({},Backbone.Events);
    app.create = function(ns,scope){
    	var parts = ns.split(".");
    	var object = scope || this;
        var length;
    	for(i = 0, length=parts.length; i<length; i++){
    		if(!object[parts[i]]) {
    			object[parts[i]] = {};
    		}
    		object = object[parts[i]];
    	}
    	return object;
    };
    var _regionalmap = {};
    app.create("Regional");
    app.create("Storage");
    _.extend(app.Regional, {
		create: function(config,viewtype){
			if(!config.name) throw new Error('DEV::Core.Regional::You must give this regional view a name...');
			if(_regionalmap[config.name]) console.warn('DEV::Core.Regional::You have overriden regional view \'', config.name, '\'');
			
			_regionalmap[config.name] = Expand[viewtype].extend(config);
			return _regionalmap[config.name];
			
		},

		get: function(name, options){
			if(!name) return _.keys(_regionalmap);

			var Def = _regionalmap[name];
			if(options) return new Def(options);
			return new Def();
		}

	});


    _.extend(app, {
		view: function(options /*or name*/, instant){
			if(_.isBoolean(options)) 
				throw new Error('DEV::Application.view::pass in {options} or a name string...');
			if(_.isString(options) || !options) 
				return app.Regional.get(options);
			var Def;
            var viewtype = options.type||"View";

			if(!options.name){
				Def = Expand[viewtype].extend(options);
				if(instant) return new Def(instant);
			}
			else //named views should be regionals in concept
				Def = app.Regional.create(options,viewtype);
			return Def;
		},
        _delegateEvents: function() {
            var delegateEventSplitter = /^(\S+)\s*(.*)$/;
            var events = this.events;
            if (!(events || (events = _.result(this, 'events')))) return this;
            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) continue;
                var match = key.match(delegateEventSplitter);
                this.delegate(match[1], match[2], _.bind(method, this));
            }
            return this;
        },
        delegate: function(eventName, selector, listener) {
            $(".app").on(eventName + '.delegateEvents_app', selector, listener);
        },
        _bindTriggers:function(){
            var that = this;
            _.each(this.triggers,function(value,key){
                that.on(key,that[value]);
            });
        },
	});

    var beforStart = function(){
    	app._regions = {};
        var that = app;
        _.each($("div.app").find("[region]"), function(region){
            var regName = $(region).attr("region");
            that._regions[regName] = new Expand.Region({
                el: region,
                parentCt: that
            });
            that[regName] = that._regions[regName];
        });
    };
    app.on("befor-start",beforStart);
    // app.on("app:ajax-start",function(){
    //     //$("body").css("cursor","wait");
    // });
    // app.on("app:ajax-stop",function(){
    //     $("body").css("cursor","default");
    // });
    //app.on("delegateEvents",app.delegateEvents);
    $(document).ready(function(){
        if(app.events){
            //app.trigger("delegateEvents");
            app._delegateEvents();
        }
        if(app.triggers){
            app._bindTriggers();
        }
    	if(app.start){
    		app.trigger("befor-start");
    		app.trigger("start");
            app.start();
    	}
        $(window).on('resize', function(){
            app.trigger("app:resize");
        });
        app.trigger("app:resize");
    });
})(Backbone,Backbone.Expand);