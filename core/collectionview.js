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