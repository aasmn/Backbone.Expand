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
