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
window.Backbone.Expand = {};
window.Backbone.Expand.Widget = {};
;(function(Backbone,Expand){
    Expand.CollectionView = Expand.View.extend({
        constructor: function(options){
            this.options = options || {};
            //this.sort = _.isUndefined(initOptions.sort) ? false : initOptions.sort;
            options = _.extend(options,{silent:true});
            Expand.View.apply(this, [options]);
            this._initialEvents();
            this.children = [];
            if(_.isArray(options)){
                this.collection = new Backbone.Collection(options);
                this.render();
            }
            else if(options.collection){
                this.collection = options.collection;
                this.render();
            }
            
            //this._initChildViewStorage();
            
        },
        _initialEvents: function() {
            if (this.collection) {
                this.listenTo(this.collection, 'add', this._onCollectionAdd);
                this.listenTo(this.collection, 'remove', this._onCollectionRemove);
                this.listenTo(this.collection, 'reset', this.render);
                if (this.sort) {
                    this.listenTo(this.collection, 'sort', this._sortViews);
                }
            }
        },
        render: function() {
            this._renderChildren();
            return this;
        },
        _renderChildren: function() {
            this.$el.html("");
            if (_.isEmpty(this.collection)) {
                this.showEmptyView();
            } else {
                this.startBuffering();
                this.showCollection();
                this.endBuffering();
            }
        },
        showCollection: function() {
            
            this.collection.each(function(child, index) {
                var ChildView = this.getChildView(child);
                this.addChild(child, ChildView, index);
            }, this);
        },
        addChild: function(child, ChildView, index) {
            var childViewOptions = this.childViewOptions ||{};
            if (_.isFunction(childViewOptions)) {
                childViewOptions = childViewOptions.call(this, child, index);
            }
            var options = _.extend({model: child}, childViewOptions);
            var view = new ChildView(options);
            this._addChildView(view, index);

            return view;
        },
        getChildView: function(child) {
            var childView = this.childView;
            if (!childView) {
                throw new Error({
                    name: 'NoChildViewError',
                    message: 'A "childView" must be specified'
                });
            }
            return childView;
        },
        _addChildView: function(view, index) {
            this.proxyChildEvents(view);
            this.children.splice(index,0,view);
            this.renderChildView(view,index);

        },
        renderChildView: function(view, index) {
            //view.render();
            this.attachHtml(this, view, index);
            return view;
        },
        attachHtml: function(collectionView, childView, index) {
            if (collectionView.isBuffering) {
                collectionView.elBuffer.appendChild(childView.el);
                collectionView._bufferedChildren.push(childView);
            }else {
              // If we've already rendered the main collection, append
              // the new child into the correct order if we need to. Otherwise
              // append to the end.
              if (!collectionView._insertBefore(childView, index)){
                collectionView._insertAfter(childView);
              }
            }
        },
        _insertBefore: function(childView, index) {
            var currentView;
            var findPosition =  (index < this.children.length - 1);
            if (findPosition) {
              // Find the view after this one
              currentView = _.find(this.children,function (view,idx) {
                return idx === index + 1;
              });
            }

            if (currentView) {
              currentView.$el.before(childView.el);
              return true;
            }

            return false;
        },
        _insertAfter: function(childView) {
            this.$el.append(childView.el);
        },
        showEmptyView:function(){
            this.$el.append("No data.");
        },
        // Instead of inserting elements one by one into the page,
        // it's much more performant to insert elements into a document
        // fragment and then insert that document fragment into the page
        initRenderBuffer: function() {
            this.elBuffer = document.createDocumentFragment();
            this._bufferedChildren = [];
        },
        startBuffering: function() {
            this.initRenderBuffer();
            this.isBuffering = true;
        },
        endBuffering: function() {
            this.isBuffering = false;
            this.$el.append(this.elBuffer);
            this.initRenderBuffer();
        },
        _onCollectionAdd: function(child){
            //this.startBuffering();
            var ChildView = this.getChildView(child);
            var index = this.collection.indexOf(child);
            this.addChild(child, ChildView, index);
            this.endBuffering();
        },
        proxyChildEvents: function(view) {
            var prefix = "childview";
            this.listenTo(view, 'all', function() {
                var args = _.toArray(arguments);
                var rootEvent = args[0];
                var childEvents = this.normalizeMethods(_.result(this, 'childEvents'));

                args[0] = prefix + ':' + rootEvent;
                args.splice(1, 0, view);

                // call collectionView childEvent if defined
                if (typeof childEvents !== 'undefined' && _.isFunction(childEvents[rootEvent])) {
                    childEvents[rootEvent].apply(this, args.slice(1));
                }

                //this.triggerMethod.apply(this, args);
            }, this);
        },
        normalizeMethods:function(hash) {
            return _.reduce(hash, function(normalizedHash, method, name) {
                if (!_.isFunction(method)) {
                    method = this[method];
                }
                if (method) {
                    normalizedHash[name] = method;
                }
                return normalizedHash;
            }, {}, this);
        },
        _onCollectionRemove:function(model,collection,pos){
            var view = this.children.splice(pos.index,1);
            this.removeChildView(view[0]);
        },
        removeChildView: function(view) {
            if (view) {
              // call 'destroy' or 'remove', depending on which is found
              if (view.destroy) { view.destroy(); }
              else if (view.remove) { view.remove(); }
            }

            return view;
        },
    });
})(Backbone,Backbone.Expand);
;(function(Backbone,Expand){
    Expand.CompositeView = Expand.CollectionView.extend({
        constructor: function(){
            Expand.CollectionView.apply(this, arguments);
        },
        _initialEvents: function() {
            // Bind only after composite view is rendered to avoid adding child views
            // to nonexistent childViewContainer

            if (this.collection) {
              this.listenTo(this.collection, 'add', this._onCollectionAdd);
              this.listenTo(this.collection, 'remove', this._onCollectionRemove);
              this.listenTo(this.collection, 'reset', this._renderChildren);

              if (this.sort) {
                this.listenTo(this.collection, 'sort', this._sortViews);
              }
            }
        },
        render: function() {
            this._ensureViewIsIntact();
            this.isRendered = true;
            this.resetChildViewContainer();

            this._renderChildren();

            //this.triggerMethod('render', this);
            return this;
        },
        _renderChildren: function() {
            if (this.isRendered) {
              Expand.CollectionView.prototype._renderChildren.call(this);
            }
        },
        attachElContent: function(html) {
            this.$el.html(html);
            return this;
        },

        // You might need to override this if you've overridden attachHtml
        attachBuffer: function(compositeView, buffer) {
            var $container = this.getChildViewContainer(compositeView);
            $container.append(buffer);
        },
        // Internal method. Append a view to the end of the $el.
        // Overidden from CollectionView to ensure view is appended to
        // childViewContainer
        _insertAfter: function (childView) {
            var $container = this.getChildViewContainer(this);
            $container.append(childView.el);
        },

        // Internal method to ensure an `$childViewContainer` exists, for the
        // `attachHtml` method to use.
        getChildViewContainer: function(containerView) {
            if ('$childViewContainer' in containerView) {
                return containerView.$childViewContainer;
            }

            var container;
            var childViewContainer = Marionette.getOption(containerView, 'childViewContainer');
            if (childViewContainer) {
                var selector = _.isFunction(childViewContainer) ? childViewContainer.call(containerView) : childViewContainer;
                if (selector.charAt(0) === '@' && containerView.ui) {
                    container = containerView.ui[selector.substr(4)];
                } else {
                    container = containerView.$(selector);
                }
                if (container.length <= 0) {
                    throw new Marionette.Error({
                        name: 'ChildViewContainerMissingError',
                        message: 'The specified "childViewContainer" was not found: ' + containerView.childViewContainer
                    });
                }

            } else {
                container = containerView.$el;
            }

            containerView.$childViewContainer = container;
            return container;
        },

        // Internal method to reset the `$childViewContainer` on render
        resetChildViewContainer: function() {
            if (this.$childViewContainer) {
                delete this.$childViewContainer;
            }
        }
    });
})(Backbone,Backbone.Expand);
;(function(Backbone){
	var region = function(options){
		this.options = options || {};
	    this.el = this.getOption('el');
	    // Handle when this.el is passed in as a $ wrapped element.
	    this.el = this.el instanceof Backbone.$ ? this.el[0] : this.el;
	    if (!this.el) {
	      throw new Error({
	        name: 'NoElError',
	        message: 'An "el" must be specified for a region.'
	      });
	    }

	    this.$el = this.getEl(this.el);
	    this.$el.addClass("region");
	    this.$el.addClass("region-" + this.$el.attr("region"));
	    this._regions = {};
	    this.on("load-view", this.onLoadView);
	};
	_.extend(region.prototype, Backbone.Events,{
		getEl: function(el) {
		    return Backbone.$(el);
		},
		getOption: function(optionName) {
		  if (!optionName) { return; }
		  if (this.options && (this.options[optionName] !== undefined)) {
		    return this.options[optionName];
		  } else {
		    return this[optionName];
		  }
		},
		_destroyView: function() {
		    var view = this.currentView;
		    if(!view) return;
		    if ("destroy" in view && !view.isDestroyed) {
		      view.destroy();
		    } else if (view.remove) {
		      view.remove();
		      view.isDestroyed = true;
		    }
		},
		attachHtml: function(view) {
		    // empty the node and append new view
		    // We can not use `.innerHTML` due to the fact that IE
		    // will not let us clear the html of tables and selects.
		    // We also do not want to use the more declarative `empty` method
		    // that jquery exposes since `.empty` loops over all of the children DOM
		    // nodes and unsets the listeners on each node. While this seems like
		    // a desirable thing, it comes at quite a high perf cost. For that reason
		    // we are simply clearing the html contents of the node.
		    if(view.el!==this.el){
		    	this.$el.html('');
		    	this.el.appendChild(view.el);
		    }
		},
		show: function(view){
			this._destroyView();
			//view.render();
			if(!view.parentCt)
				view.parentCt = this.options.parentCt;
			this.attachHtml(view);
			this.currentView = view;
		},
		onLoadView: function(name,options){
			var view = Application.Regional.get(name,options);
			this.show(view);
		}
	});
	Backbone.Expand.Region = region;
	
})(Backbone);
;(function(app, _, $){

	app.remote = {};
	function notify(jqXHR,options){
		var options = JSON.parse(JSON.stringify(options));
		jqXHR
		.done(function(data, textStatus, jqXHR){
			app.trigger('app:success', {
				data: data, 
				textStatus: textStatus,
				jqXHR: jqXHR,
			},options);
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			app.trigger('app:error', {
				errorThrown: errorThrown,
				textStatus: textStatus,
				jqXHR: jqXHR
			},options);
		});
		return jqXHR;
	}

	_.extend(app.remote, {
		//GET
		get: function(options){
			options = fixOptions(options);
			options.type = 'GET';
			app.trigger('app:remote-pre', options);
			return notify($.ajax(options),options);
		},

		//POST(no payload._id)/PUT/DELETE(payload = {_id: ...})
		post: function(options){
			if("data" in options && _.isObject(options.data))
				options.data = JSON.stringify(options.data);
			options.type = 'POST';
			app.trigger('app:remote-pre', options);
			return notify($.ajax(options),options);
		}

	});

	//Global ajax event triggers
	$(document).ajaxStart(function() {
		app.trigger('app:ajax-start');
	});
	$(document).ajaxStop(function() {
		app.trigger('app:ajax-stop');
	});
	

})(Application, _, jQuery);
;(function(Expand){

	var namefix = /[\.\/]/;
	var templatePath = "js/template"
	var Template = {
		build: function (name, tplString){
			//if(arguments.length === 0 || _.string.trim(name) === '') return {id:'#_blank', tpl: ' '};
			if(arguments.length === 1) {
				//if(_.string.startsWith(name, '#')) return {id: name};
				tplString = name;
				name = null;
				//name = _.uniqueId('tpl-gen-');
				//if(!_.isArray(tplString)) tplString = [tplString];
			}
			var tpl = _.isArray(tplString)?tplString.join(''):tplString;

			if(name) {
				//process name to be valid id string, use String() to force type conversion before using .split()
				var id = this.normalizeId(name);
				var $tag = $('head > script[id="' + id + '"]');
				if($tag.length > 0) {
					//override
					$tag.html(tpl);
					this.cache.clear('#' + name);
				}
				else $('head').append(['<script type="text/tpl" id="', id, '">', tpl, '</script>'].join(''));
			}

			return tpl;
		},

		//load all prepared/combined templates from server (*.json without CORS)
		//or
		//load individual tpl into (Note: that tplName can be name or path to html) 
		remote: {
			map: {},
			load: function(name, base){
				var that = this;
				var url = (base || templatePath) + '/' + name;
				if(this.map[name]) return this.map[name];
				var result = '';
				$.ajax({
					url: url,
					dataType: 'html',
					async: false
				}).done(function(tpl){
					// if(that.map[name]){
					// 	//override
					// 	//Template.cache.clear('@' + name);
					// 	console.log('DEV::Template::', name, 'overriden');	
					// }
					result = that.map[name] = tpl;
				}).fail(function(){
					throw new Error('Template::Can not load template...' + url + ', re-check your app.config.viewTemplates setting');
				});
				return result;
				
			},

			get: function(name){
				if(!name) return _.keys(this.map);
				return this.map[name];
			}
		}

	};

	Expand.Tpl = Template;

})(Backbone.Expand);
;(function(Backbone,Expand){
    Expand.View = Backbone.View.extend({
        constructor: function(options) {    
            Backbone.View.apply(this, arguments);
            this.options = options || {};
            if(!this.options.silent) this.options.silent = false;
            if(this.triggers) this._bindTriggers();
            this._formateTemplate();
            if(this.render && !this.options.silent){
                this.render();
                this._regions = {};
                this._afterRender();
            }
            if(this.onShow){
                this.onShow.call(this,options);
                //var that = this;
                //_.defer(function(){
                //    that.onShow(options);
                //});
            }
        },
        _formateTemplate: function(){
            if(this.template && _.isString(this.template) && this.template[0] === '@'){
                this.template = Expand.Tpl.remote.load(this.template.substr(1));
            }
        },
        _bindTriggers:function(){
            var that = this;
            _.each(this.triggers,function(value,key){
                that.on(key,that[value]);
            });
        },
        _ensureViewIsIntact: function(){
            if (this.isDestroyed) {
                throw new Error({
                    name: 'ViewDestroyedError',
                    message: 'View  has already been destroyed and cannot be used.'
                });
            }
        },
        _afterRender:function(){
            if(this.$el){
                var that = this;
                _.each(this.$el.find("[region]"), function(region){
                    var regName = $(region).attr("region");
                    that._regions[regName] = new Expand.Region({
                        el: region,
                        parentCt: that
                    });
                    that[regName] = that._regions[regName];
                });
            }
        }

    });
})(Backbone,Backbone.Expand);
;(function(Backbone,Expand,app){
	var error = app.view({
		template:'<span class="error-text"></span>',
		render: function(){
			this.$el.append(this.template);
			this.options.errMsg || (this.options.errMsg = "Fail to get data from server!");
			this.$('.error-text').text(this.options.errMsg);
		}
	});
	app.Error = error;
	var loading = app.view({
		template: '<img src="../images/loading_1.gif" /><span>loading</span>',
		render: function(){
			this.$el.append(this.template);
		}
	});
	app.Loading = loading;
})(Backbone,Backbone.Expand,Application);
(function(Backbone,Expand,app){
    var datagrid_cells = {};
    var Header = Expand.CompositeView.extend({
        tagName: 'tr',
        initialize: function(options){
            this.options = options;
            this.collection = new Backbone.Collection(options);
        },
        getChildView:function(child){
            var type = child.get("headercell") || child.get("cell") || "";
            type = 'Header' + type + "Cell";
            return datagrid_cells[type];
        }
    });

    var Row = Expand.CompositeView.extend({
        tagName: 'tr',
        initialize: function(options){
            this.options = options;
            this.collection = options.collection;
            this.listenTo(this.model,"change:show",this.show);
        },
        getChildView: function(child){ // child is a model
            var type = child.get('cell') || "";
            type = "Data" + type + "Cell";
            return datagrid_cells[type];
        },
        childViewOptions:function(){
            return {row: this};
        },
        show: function(){
            var show = this.model.get("show");
            if(show === "" || show){
                this.$el.show();
            }else{
                this.$el.hide();
            }
        }
    });
    var Body = Expand.CollectionView.extend({
        childView: Row,
        tagName: 'tbody',
        childViewOptions: function(model, index){
            return {
                collection: new Backbone.Collection(_.map(this.options.cols, function(column){
                    return _.extend({
                        value: model.get(column.name) || ''
                    }, column);
                })),
                body: this //passing body to row view
            };
        }
    });
    var Table = Expand.View.extend({
        tagName: 'table',
        render: function(){
            var options = this.options;
            if(options.header){
                var headerview = new Header(options.header);
                this.header = headerview;
                var header = $("<thead></thead>");
                header.append(headerview.$el);
                this.$el.append(header);
            }
        },
        renderData: function(data){
            var options = this.options;
            this.$('tbody').remove();
            var collection = new Backbone.Collection(data);
            if(options.cols){
                var body = new Body({
                    cols: options.cols,
                    collection: collection
                });
                this.$el.append(body.$el);
                this.body = body;
            }
        },
        addData:function(data){
            if(!this.body)
                this.renderData();
            this.body.collection.add(data);
        }

    });
    app.Widget.DataGrid = Expand.View.extend({
        triggers:{
            "scroll": "onScroll"
        },
        constructor: function(options){
            options || (options = {});
            this.options = options;
            if(!options.header){
                if(_.isArray(options.cols)){
                    options.header = [];
                    _.each(options.cols,function(col){
                        options.header.push(_.extend({value:col.header || col.name},col));
                    });
                }
            }
            Expand.View.apply(this, arguments);
        },
        render: function(){
            var options = this.options;
            if(options.header){
                var head = $("<div></div>");
                this.headdiv = head;
                this.head = new Table(options);
                head.append(this.head.$el);
                this.bodyview = new Table(options);
                
                this.$el.append(this.headdiv);
                this.$el.append(this.bodyview.$el);
                this.$el.removeClass(this.className);
                var $head = this.head.$el;
                var $body = this.bodyview.$el;
                this.headdiv.addClass('dg-head-float');
                $body.addClass('dg-head-hidden');
            }
            var that = this;
            _.delay(function(){
                var $parent = that.$el.scrollParent();
                if($parent.length>0){
                    $parent.on('scroll',function(e){
                        that.trigger('scroll',e.target.scrollLeft);
                    });
                }
            },100);
        },
        renderData: function(data){
            this.bodyview.renderData(data);
            this.body = this.bodyview.body;
            var $head = this.head.$el;
            var $body = this.bodyview.$el;
            var $headdiv = this.headdiv;
            _.delay(function(){
                var bodyths = $body.find("th");
                $headdiv.width($headdiv.parent().width());
                $head.width($body.width());
                $head.find("th").each(function(index,el){
                    var width = $(bodyths[index]).width();
                    $(el).width(width);
                    $(bodyths[index]).width(width);
                });
            },100);
        },
        addData:function(data){
            this.bodyview.addData(data);
            this.body = this.bodyview.body;
            var $head = this.head.$el;
            var $body = this.bodyview.$el;
            var $headdiv = this.headdiv;
            _.delay(function(){
                var bodyths = $body.find("th");
                $headdiv.width($headdiv.parent().width());
                $head.width($body.width());
                $head.find("th").each(function(index,el){
                    $(el).width($(bodyths[index]).width());
                });
            },100);
        },
        onScroll: function(left){
            this.headdiv.scrollLeft(left);
        }

    });
    datagrid_cells.HeaderCell = Expand.View.extend({
        tagName: 'th',
        render: function(){
            this.$el.text(this.model.get("value"));
            this.$el.attr('title',this.model.get("value"));
        }
    });
    datagrid_cells.HeaderCheckboxCell = Expand.View.extend({
        tagName: 'th',
        events:{
            'click input': function(e){
                this.action(e.target,this.model);
            }
        },
        template: '<input type="checkbox" value="<%=value%>"/>',
        initialize: function(options){
            this.action = this.model.get('action');
        },
        render: function(){
            var tempfn = _.template(this.template);
            this.$el.append(tempfn(this.model.toJSON()));
            this.$el.css('text-align','center')
        }
    });
    datagrid_cells.HeaderThCheckboxCell = Expand.View.extend({
        tagName: 'th',
        initialize: function(options){
            this.action = this.model.get('action');
        },
        render: function(){
            var model = new Backbone.Model({
                checked:"unchecked",
                text:''
            });
            var ckbox = new app.Checkbox({model:model})
            this.$el.append(ckbox.$el);
            this.listenTo(ckbox,'all',this.action);
            this.checkmodel = model;
            this.$el.css('text-align','center');
        }
    });
    datagrid_cells.DataCheckboxCell = Expand.View.extend({
        tagName: 'td',
        template: '<input type="checkbox" value="<%=value%>"/>',
        events:{
            'click' : 'clicked'
        },
        initialize: function(options){
            this.row = options.row;
            this.listenTo(this.row.model, 'change:selected', this.selected);
        },
        render: function(){
            var tempfn = _.template(this.template);
            this.$el.html(tempfn(this.model.toJSON()));
            if(this.row.model.get('selected'))
                this.$('input')[0].checked = true;
            if(this.row.model.get('disabled'))
                this.$('input').attr('disabled',true);
            this.$el.css('text-align','center');
        },
        clicked: function(){
            this.row.model.set('selected',this.$('input')[0].checked,{silent:true});
        },
        selected: function(){
            this.$('input')[0].checked = this.row.model.get('selected');
        }
    });
    datagrid_cells.DataCell = Expand.View.extend({
        tagName: 'td',
        render: function(){
            this.$el.text(this.model.get("value"));
            this.$el.attr('title',this.model.get("value"));
        }
    });

    app.Widget.LzDataGrid = app.view({
        template:[//'<div region="tableheader"></div>',
                  '<div class="lzgrid-content">',
                    '<div region="tablebody"></div>',
                    '<div region="fill" class="lzgrid-fill"></div></div>'],
        className:'lzDataGrid',
        triggers:{
            'fetch': 'onFetchData'
        },
        render: function(){
            this.$el.append(this.template.join(''));
            this.pageIndex = 0;
            this.pageSize = this.options.pageSize || 10;
            this.currentCount = 0;
            var that = this;
            _.defer(function(){
                that.trigger('loading');
                this.isLoading = true;
            });
            
        },
        onShow: function(){
            this.fill.show(new app.Loading());
        },
        _init: function(data){
            var cols = this.options.cols || this._formateCols(data[0]);
            this.tablebody.show(new app.Widget.DataGrid({
                cols: cols,
                className: this.options.tableClass || ''
            }));
            this.tablebody.currentView.addData(data);
            this.dataCount = this.dataCount || data.length;
            this.$el.height(this.$el.parent().height());
            this.$('.lzgrid-content').height(this.$el.height());
            var that = this;
            this.$('div.lzgrid-content').scroll(function(){
                that.onScroll.apply(that,arguments);
            });
        },
        onFetchData: function(data,count){
            this.$('div.lzgrid-content').css("overflow-x","scroll");
            this.pageIndex ++;
            if(data.length===0) return;
            if (this.tablebody.currentView) {
                this.tablebody.currentView.addData(data);
            } else {
                if(count > 0) this.dataCount= count;
                this._init(data);
            }
            this.currentCount += data.length;
            this._resizeFill();
            this.isLoading = false;
            this.$('div.lzgrid-content').css("overflow-x","auto");
        },
        _resizeFill: function(){
            if(this.currentCount >= this.dataCount){
                this.$('.lzgrid-fill').hide();
                this.stopLoading = true;
            }else{
                this.$('.lzgrid-fill').show();
                var lineHeight = this.tablebody.$el.find('td').height();
                var fillHeight = this.dataCount * lineHeight - this.tablebody.$el.height();
                this.$('.lzgrid-fill').height(fillHeight);
            }
        },
        _formateCols: function(data){
            var cols = [];
            _.each(_.keys(data),function(key){
                cols.push({name:key});
            });
            return cols;
        },
        onScroll: function(e){
            //this.tablebody.currentView.trigger('scroll',e.target.scrollLeft);
            if(this.loading || this.stopLoading){
                e.preventDefault();
                return;
            }
            var container = e.target;
            var scollTop = container.scrollTop;
            var tableHeight = this.tablebody.currentView.$el.height();
            if(scollTop + $(container).height()> tableHeight +30){
                container.scollTop = tableHeight + 20 - $(container).height();
                this.trigger('loading');
                this.isLoading = true;
                e.preventDefault();
            }
        }
    });
})(Backbone,Backbone.Expand,Application);

;(function(Backbone,Expand,app){
	var ui = Expand.View.extend({
	    className: 'widget-dialog ui-front',
		template: ['<h4 class="title"><span class="titlespan"></span><span class="close"><img src="Img/n_diagioclose_btn.png" /></span></h4>',
					'<div class="content" region="content">'].join(""),
		events:{
		    "click .close": "close",
            "click" : function(e) {
                e.stopPropagation();
                //e.preventDefault();
            }
		},
		initialize:function(options){
			if(options.unique !==false){
				if(app._dialog)
					app._dialog.close();
				app._dialog = this;
			}
			this.modal = options.modal || false;
		},
		render: function () {
		    this.$el.css("z-index", this.getMaxZindex());
			this.$el.append($(this.template));
			if(this.options.title){
				this.$(".titlespan").text(this.options.title);
			}else{
				this.$(".title").height(0);
			}

		},
		getMaxZindex: function () {
		    if (this.options.unique !== false) {
		        return Math.max.apply(null, $.map($('body div'), function (e) {
                        return parseInt($(e).css('z-index')) || 1;
                    }))+1;
		    }
		    var zIndicies = $(".widget-dialog").map(function() {
		        return (+ $(this).css("z-index")) + 1;
		    });
		    return zIndicies.length ? Math.max.apply(null, zIndicies) : 1001;
		},
	    onShow: function () {
		    $("body").append(this.$el);
			var contentView = this.options.content;
            if (contentView) {
                this.options.contentOptions = this.options.contentOptions || {};
                if (!_.isString(contentView)) {
                    this.content.show(new contentView(this.options.contentOptions));
                } else {
                    this.content.trigger("load-view", contentView, this.options.contentOptions);
                }
                this.contentView = this.content.currentView;
            }
			this.listenTo(this.contentView,'close',this.close);
		},
		close:function(){
			this.trigger('close');
			this.stopListening(app,'clearFloat');
			this.$el.remove();
			if (this.modal && this.modalOverlays) {
			    this.modalOverlays.remove();
			}
		},
	    modalOverlays:null,
		show:function(pos){
			if(pos){
				var max_y = $(window).height() - this.$el.height();
				max_y > 0 || (max_y = 0);
				var y = pos.y > max_y ? max_y: pos.y;

				var max_x = $(window).width() - this.$el.width();
				max_x > 0 || (max_x = 0);

				var x = 0;
				if(pos.x > max_x){
					pos.left = pos.left || pos.x;
					x = pos.left - this.$el.width() - 15;
					if(x < 0)
						if(pos.left >($(window).width() - pos.x)){
							x = 0;
						}else{
							x = pos.x; 
						}
				}else{
					x = pos.x;
				}

				this.$el.css({
					top: y +"px",
            		left: x + "px",
            		"margin-top":0,
    				"margin-left": 0
				});
			}else{
				this.$el.css({
					top: "50%",
            		left: "50%",
            		"margin-top": -this.$el.height()/2-100 + "px",
    				"margin-left": -this.$el.width()/2+"px"
				});
			}
		    this.$el.draggable({
		        cancel: ".content",
		        containment: "document",
		        scroll: false,
		        iframeFix: true,
		        handle: "h4"
		    });
			var that = this;
            _.defer(function(){
                that.listenToOnce(app,'clearFloat',that.close);
            },100);
            this.$el.show();

            if(this.modal) {
                this.modalOverlays = $('<div class="widget-dialog-modal"></div>').css("z-index", this.$el.css("z-index") - 1);
                $('body').append(this.modalOverlays);
            }
		}
	});

	app.Widget.Dialog = ui;
})(Backbone,Backbone.Expand,Application);

;(function(Backbone,Expand,app){
    var ToolTip = app.view({
        className: 'tooltip',
        render: function(){
            this.$el.text(this.model.get('content'));
            $("body").append(this.$el);
            var pos = this.model.get("pos");
            this.$el.css({
                top: pos.y,
                left: pos.x
            });
        },
        close: function(){
            this.$el.remove();
        }
    });
    var listItem = app.view({
        template: "<a><%=value%></a>",
        tagName: "li",
        events:{
            'click a': 'onClick',
            'mouseenter': function(e){
                e.stopPropagation();
                e.preventDefault();
                var pos = {
                    x: e.clientX +5,
                    y: e.clientY + 5
                };
                var text = this.$el.text();
                var model = new Backbone.Model({content: text, pos: pos});
                this.tooltip = new ToolTip({model:model});
            },
            'mouseleave': function(e){
                e.stopPropagation();
                e.preventDefault();
                this.tooltip.close();
            }
        },
        initialize: function(){
            this.listenTo(this.model,'change:active',this.active);
        },
        render: function() {
            if (!this.model) return;
            var item = _.template(this.template);
            this.$el.append(item(this.model.toJSON()));
        },
        onClick:function(e){
            e.preventDefault();
            e.stopPropagation();
            this.trigger('clicked',this.model);
        },
        active: function(model,active){
            if(active){
                this.$el.addClass('active');
            }else{
                this.$el.removeClass('active');
            }
        }
    });
    var ListView = app.view({
        tagName: "ul",
        type: "CollectionView",
        childView: listItem,
        childEvents:{
            'clicked':'clicked'
        },
        clicked: function(view,model) {
            var acmodel = this.collection.find(function(m){
                return m.cid !== model.cid && m.get("active");
            });
            if(acmodel) acmodel.set('active',false);
            model.set('active',true);
            if(this.options.actions.clicked){
                this.options.actions.clicked.apply(this.parentCt,[model,view]);
            }
        },
        active: function(index) {
            this.collection.at(index).set('active',true);
            this.clicked(null,this.collection.at(index));
        },
        childViewOptions: function(model){
            model.set('value',model.get(this.options.labelField));
            return {
                model: model
            };
        }
    });
    app.Widget.ListView = ListView;
})(Backbone,Backbone.Expand,Application);

(function(Backbone, Expand, app) {

    var dialog = app.Widget.Dialog.extend({
        events: function() {
            return _.extend(this.parent.events, { "click": function(e) {} });
        },
        modal: true,
        parent:app.Widget.Dialog.prototype,
        initialize: function (options) {
            options.unique = false;
            this.parent.initialize.call(this, options);
            this.modal = true;
        },

        //app.Widget.Dialog.initialize.apply(this,options)
        close: function (e) {
            this.stopListening(app, 'clearFloat');
            this.$el.hide();
            if (this.modal && this.modalOverlays) {
                this.modalOverlays.remove();
            }

            if (e && e.currentTarget) {
                this.trigger("closeAction");
            }
        },
        setTitle: function(title) {
            this.$(".titlespan").text(title);
        }
    });


    app.ModalDialog = dialog;

})(Backbone, Backbone.Expand, Application);