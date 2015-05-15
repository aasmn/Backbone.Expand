(function (Backbone, Expand, app) {

    var ui = app.Widget.Alert.extend({
        className: 'widget-dialog alert confirm',
        templateCancelButton: "<button class='btn-cancel'>Cancel</button>",
        //events: function() {
        //    return _.extend(this.parent.events, { "click .btn-cancel": "close" });
        //},
        constructor: function() {
            this.events = _.extend(this.parent.events, this.events);
            app.Widget.Alert.apply(this, arguments);
        },
        parent: app.Widget.Alert.prototype,
        ok: function() {
            this.parent.ok.call(this);
            if (this.okFun) {
                this.okFun();
            }
        },
        events: {
             "click .btn-cancel": "close"
        },
        close: function() {
            this.parent.close.call(this);
            if (this.cancelFun) {
                this.cancelFun();
            }
        },
        show: function(message, okFun, cancelFun) {
            this.parent.show.call(this, message);
            this.okFun = okFun;
            this.cancelFun = cancelFun;
        }
    });


    window.sysConfirm = window.confirm;//system confirm
    var confirmView = new ui();
    window.confirm = function (msg) {
        confirmView.show(msg, arguments[1], arguments[2]);
    };

})(Backbone, Backbone.Expand, Application);