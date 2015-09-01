(function(Backbone,Expand,app){
    var datagrid_cells = {};
    var Header = Expand.CompositeView.extend({
        tagName: 'tr',
        initialize: function(options){
            this.options = options;
            this.collection = new Backbone.Collection(options);
        },
        getChildView:function(child){
            var type = child.get("headercell") || child.get("cell") || "";
            type = 'Header' + type + "Cell";
            return datagrid_cells[type];
        }
    });

    var Row = Expand.CompositeView.extend({
        tagName: 'tr',
        initialize: function(options){
            this.options = options;
            this.collection = options.collection;
            this.listenTo(this.model,"change:show",this.show);
        },
        getChildView: function(child){ // child is a model
            var type = child.get('cell') || "";
            type = "Data" + type + "Cell";
            return datagrid_cells[type];
        },
        childViewOptions:function(){
            return {row: this};
        },
        show: function(){
            var show = this.model.get("show");
            if(show === "" || show){
                this.$el.show();
            }else{
                this.$el.hide();
            }
        }
    });
    var Body = Expand.CollectionView.extend({
        childView: Row,
        tagName: 'tbody',
        childViewOptions: function(model, index){
            return {
                collection: new Backbone.Collection(_.map(this.options.cols, function(column){
                    return _.extend({
                        value: model.get(column.name) || ''
                    }, column);
                })),
                body: this //passing body to row view
            };
        }
    });
    var Table = Expand.View.extend({
        tagName: 'table',
        render: function(){
            var options = this.options;
            if(options.header){
                var headerview = new Header(options.header);
                this.header = headerview;
                var header = $("<thead></thead>");
                header.append(headerview.$el);
                this.$el.append(header);
            }
        },
        renderData: function(data){
            var options = this.options;
            this.$('tbody').remove();
            var collection = new Backbone.Collection(data);
            if(options.cols){
                var body = new Body({
                    cols: options.cols,
                    collection: collection
                });
                this.$el.append(body.$el);
                this.body = body;
            }
        },
        addData:function(data){
            if(!this.body)
                this.renderData();
            this.body.collection.add(data);
        }

    });
    app.Widget.DataGrid = Expand.View.extend({
        triggers:{
            "scroll": "onScroll"
        },
        constructor: function(options){
            options || (options = {});
            this.options = options;
            if(!options.header){
                if(_.isArray(options.cols)){
                    options.header = [];
                    _.each(options.cols,function(col){
                        options.header.push(_.extend({value:col.header || col.name},col));
                    });
                }
            }
            Expand.View.apply(this, arguments);
        },
        render: function(){
            var options = this.options;
            if(options.header){
                var head = $("<div></div>");
                this.headdiv = head;
                this.head = new Table(options);
                head.append(this.head.$el);
                this.bodyview = new Table(options);
                
                this.$el.append(this.headdiv);
                this.$el.append(this.bodyview.$el);
                this.$el.removeClass(this.className);
                var $head = this.head.$el;
                var $body = this.bodyview.$el;
                this.headdiv.addClass('dg-head-float');
                $body.addClass('dg-head-hidden');
            }
            var that = this;
            _.delay(function(){
                var $parent = that.$el.scrollParent();
                if($parent.length>0){
                    $parent.on('scroll',function(e){
                        that.trigger('scroll',e.target.scrollLeft);
                    });
                }
            },100);
        },
        renderData: function(data){
            this.bodyview.renderData(data);
            this.body = this.bodyview.body;
            var $head = this.head.$el;
            var $body = this.bodyview.$el;
            var $headdiv = this.headdiv;
            _.delay(function(){
                var bodyths = $body.find("th");
                $headdiv.width($headdiv.parent().width());
                $head.width($body.width());
                $head.find("th").each(function(index,el){
                    var width = $(bodyths[index]).width();
                    $(el).width(width);
                    $(bodyths[index]).width(width);
                });
            },100);
        },
        addData:function(data){
            this.bodyview.addData(data);
            this.body = this.bodyview.body;
            var $head = this.head.$el;
            var $body = this.bodyview.$el;
            var $headdiv = this.headdiv;
            _.delay(function(){
                var bodyths = $body.find("th");
                $headdiv.width($headdiv.parent().width());
                $head.width($body.width());
                $head.find("th").each(function(index,el){
                    $(el).width($(bodyths[index]).width());
                });
            },100);
        },
        onScroll: function(left){
            this.headdiv.scrollLeft(left);
        }

    });
    datagrid_cells.HeaderCell = Expand.View.extend({
        tagName: 'th',
        render: function(){
            this.$el.text(this.model.get("value"));
            this.$el.attr('title',this.model.get("value"));
        }
    });
    datagrid_cells.HeaderCheckboxCell = Expand.View.extend({
        tagName: 'th',
        events:{
            'click input': function(e){
                this.action(e.target,this.model);
            }
        },
        template: '<input type="checkbox" value="<%=value%>"/>',
        initialize: function(options){
            this.action = this.model.get('action');
        },
        render: function(){
            var tempfn = _.template(this.template);
            this.$el.append(tempfn(this.model.toJSON()));
            this.$el.css('text-align','center')
        }
    });
    datagrid_cells.HeaderThCheckboxCell = Expand.View.extend({
        tagName: 'th',
        initialize: function(options){
            this.action = this.model.get('action');
        },
        render: function(){
            var model = new Backbone.Model({
                checked:"unchecked",
                text:''
            });
            var ckbox = new app.Checkbox({model:model})
            this.$el.append(ckbox.$el);
            this.listenTo(ckbox,'all',this.action);
            this.checkmodel = model;
            this.$el.css('text-align','center');
        }
    });
    datagrid_cells.DataCheckboxCell = Expand.View.extend({
        tagName: 'td',
        template: '<input type="checkbox" value="<%=value%>"/>',
        events:{
            'click' : 'clicked'
        },
        initialize: function(options){
            this.row = options.row;
            this.listenTo(this.row.model, 'change:selected', this.selected);
        },
        render: function(){
            var tempfn = _.template(this.template);
            this.$el.html(tempfn(this.model.toJSON()));
            if(this.row.model.get('selected'))
                this.$('input')[0].checked = true;
            if(this.row.model.get('disabled'))
                this.$('input').attr('disabled',true);
            this.$el.css('text-align','center');
        },
        clicked: function(){
            this.row.model.set('selected',this.$('input')[0].checked,{silent:true});
        },
        selected: function(){
            this.$('input')[0].checked = this.row.model.get('selected');
        }
    });
    datagrid_cells.DataCell = Expand.View.extend({
        tagName: 'td',
        render: function(){
            this.$el.text(this.model.get("value"));
            this.$el.attr('title',this.model.get("value"));
        }
    });

    app.Widget.LzDataGrid = app.view({
        template:[//'<div region="tableheader"></div>',
                  '<div class="lzgrid-content">',
                    '<div region="tablebody"></div>',
                    '<div region="fill" class="lzgrid-fill"></div></div>'],
        className:'lzDataGrid',
        triggers:{
            'fetch': 'onFetchData'
        },
        render: function(){
            this.$el.append(this.template.join(''));
            this.pageIndex = 0;
            this.pageSize = this.options.pageSize || 10;
            this.currentCount = 0;
            var that = this;
            _.defer(function(){
                that.trigger('loading');
                this.isLoading = true;
            });
            
        },
        onShow: function(){
            this.fill.show(new app.Loading());
        },
        _init: function(data){
            var cols = this.options.cols || this._formateCols(data[0]);
            this.tablebody.show(new app.Widget.DataGrid({
                cols: cols,
                className: this.options.tableClass || ''
            }));
            this.tablebody.currentView.addData(data);
            this.dataCount = this.dataCount || data.length;
            this.$el.height(this.$el.parent().height());
            this.$('.lzgrid-content').height(this.$el.height());
            var that = this;
            this.$('div.lzgrid-content').scroll(function(){
                that.onScroll.apply(that,arguments);
            });
        },
        onFetchData: function(data,count){
            this.$('div.lzgrid-content').css("overflow-x","scroll");
            this.pageIndex ++;
            if(data.length===0) return;
            if (this.tablebody.currentView) {
                this.tablebody.currentView.addData(data);
            } else {
                if(count > 0) this.dataCount= count;
                this._init(data);
            }
            this.currentCount += data.length;
            this._resizeFill();
            this.isLoading = false;
            this.$('div.lzgrid-content').css("overflow-x","auto");
        },
        _resizeFill: function(){
            if(this.currentCount >= this.dataCount){
                this.$('.lzgrid-fill').hide();
                this.stopLoading = true;
            }else{
                this.$('.lzgrid-fill').show();
                var lineHeight = this.tablebody.$el.find('td').height();
                var fillHeight = this.dataCount * lineHeight - this.tablebody.$el.height();
                this.$('.lzgrid-fill').height(fillHeight);
            }
        },
        _formateCols: function(data){
            var cols = [];
            _.each(_.keys(data),function(key){
                cols.push({name:key});
            });
            return cols;
        },
        onScroll: function(e){
            //this.tablebody.currentView.trigger('scroll',e.target.scrollLeft);
            if(this.loading || this.stopLoading){
                e.preventDefault();
                return;
            }
            var container = e.target;
            var scollTop = container.scrollTop;
            var tableHeight = this.tablebody.currentView.$el.height();
            if(scollTop + $(container).height()> tableHeight +30){
                container.scollTop = tableHeight + 20 - $(container).height();
                this.trigger('loading');
                this.isLoading = true;
                e.preventDefault();
            }
        }
    });
})(Backbone,Backbone.Expand,Application);
