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