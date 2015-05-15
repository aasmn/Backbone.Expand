;(function(Backbone,Expand,app){
    var ToolTip = app.view({
        className: 'tooltip',
        render: function(){
            this.$el.text(this.model.get('content'));
            $("body").append(this.$el);
            var pos = this.model.get("pos");
            this.$el.css({
                top: pos.y,
                left: pos.x
            });
        },
        close: function(){
            this.$el.remove();
        }
    });
    var listItem = app.view({
        template: "<a><%=value%></a>",
        tagName: "li",
        events:{
            'click a': 'onClick',
            'mouseenter': function(e){
                e.stopPropagation();
                e.preventDefault();
                var pos = {
                    x: e.clientX +5,
                    y: e.clientY + 5
                };
                var text = this.$el.text();
                var model = new Backbone.Model({content: text, pos: pos});
                this.tooltip = new ToolTip({model:model});
            },
            'mouseleave': function(e){
                e.stopPropagation();
                e.preventDefault();
                this.tooltip.close();
            }
        },
        initialize: function(){
            this.listenTo(this.model,'change:active',this.active);
        },
        render: function() {
            if (!this.model) return;
            var item = _.template(this.template);
            this.$el.append(item(this.model.toJSON()));
        },
        onClick:function(e){
            e.preventDefault();
            e.stopPropagation();
            this.trigger('clicked',this.model);
        },
        active: function(model,active){
            if(active){
                this.$el.addClass('active');
            }else{
                this.$el.removeClass('active');
            }
        }
    });
    var ListView = app.view({
        tagName: "ul",
        type: "CollectionView",
        childView: listItem,
        childEvents:{
            'clicked':'clicked'
        },
        clicked: function(view,model) {
            var acmodel = this.collection.find(function(m){
                return m.cid !== model.cid && m.get("active");
            });
            if(acmodel) acmodel.set('active',false);
            model.set('active',true);
            if(this.options.actions.clicked){
                this.options.actions.clicked.apply(this.parentCt,[model,view]);
            }
        },
        active: function(index) {
            this.collection.at(index).set('active',true);
            this.clicked(null,this.collection.at(index));
        },
        childViewOptions: function(model){
            model.set('value',model.get(this.options.labelField));
            return {
                model: model
            };
        }
    });
    app.Widget.ListView = ListView;
})(Backbone,Backbone.Expand,Application);
