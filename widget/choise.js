;(function(Backbone,Expand,app){
	var ui = app.view({
	    template:['<div region="body"></div>',
	    		  '<div class="btns"><button class="btn-yes">Yes</button>',
	    		  '<button class="btn-no">No</button>',
	    		  '<button class="btn-cancel">Cancel</button></div>'],
	    events:{
	    	'click .btn-yes': 'returnYes',
	    	'click .btn-no': 'returnNo',
	    	'click .btn-cancel': function(){
	    		this.trigger('close');
	    	}
	    },
	    className:'choise',
	   	render: function(){
	   		this.$el.append(this.template.join(''));
	   	},
	   	onShow: function(){
	   		this.body.$el.append(this.options.body||"");
	   	},
	   	returnYes: function(){
	   		this.returnFn(true);
	   	},
	   	returnNo: function(){
	   		this.returnFn(false);
	   	},
	   	returnFn: function(rtn){
	   		var fn = this.options.rtnFn || null;
	   		var scope = this.options.scope || null;
	   		if(_.isFunction(fn)){
	   			fn.call(scope||null,rtn);
	   		}else if(_.isString(fn)){
	   			if(scope){
	   				scope[fn].call(scope,rtn);
	   			}
	   		}
	   		this.trigger('close');
	   	}
	});

	app.Widget.Choise = function(options,callback,scope){
		if((!options.title)|| (!options.body)){
			console.log("DEV::Check options");
			return;
		}
		options = _.extend(options,{rtnFn:callback,scope:scope});
		var dialog = new app.ModalDialog({
			title: options.title,
			content: ui,
			contentOptions: options,
		});
		dialog.show();
	};
})(Backbone,Backbone.Expand,Application);
