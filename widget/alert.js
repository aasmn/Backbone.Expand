;
(function(Backbone, Expand, app) {
    var ui = app.view({
        className: 'widget-dialog alert',
        template: [
            '<div class="title"></span><span class="close"><img src="Img/n_diagioclose_btn.png" /></span></div>',
            '<div class="message"/>'
        ].join(""),
        templateOKButton:"<button class='btn-ok'>OK</button>",
        events: {
            'click .btn-ok': 'ok',
            "click .close": "close",
        },
        initialize: function() {
            //this.listenTo(app, "clearFloat", this.ok);
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
        render: function () {          
            this.$el.append(this.template);
            if (this.templateCancelButton) {
                this.$el.append(this.templateCancelButton);
            }
            if (this.templateOKButton) {
                this.$el.append(this.templateOKButton);
            }

            this.lastClassName = "." + this.className.split(" ").pop(); 
        },
        ok: function () {
            this.$el.hide();
            this.modalOverlays.hide();
        },
        close: function() {
            this.$el.hide();
            this.modalOverlays.hide();
        },
        show: function (message) {
            this.$(".message").text(message);
            if (!$("body").has(this.lastClassName).length) {
                $("body").append(this.$el);
                this.modalOverlays = $('<div class="widget-dialog-modal"></div>');
                $('body').append(this.modalOverlays);
            }
            this.$el.css({
                top: "50%",
                left: "50%",
                "margin-top": -this.$el.height() / 2 - 100,
                "margin-left": -this.$el.width() / 2,
                display: "block",
                'z-index': this.getMaxZindex()
            });

            this.modalOverlays.css("z-index", this.$el.css("z-index") - 1)
            this.modalOverlays.show();

        }
    });


    window.sysAlert = window.alert;//system alert
    var alertView = new ui();
    window.alert = function(msg) {
        alertView.show(msg);
    };

    app.Widget.Alert = ui;

})(Backbone, Backbone.Expand, Application);