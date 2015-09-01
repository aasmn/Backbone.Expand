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