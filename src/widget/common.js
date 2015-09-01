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