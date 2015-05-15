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