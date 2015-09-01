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