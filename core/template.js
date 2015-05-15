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