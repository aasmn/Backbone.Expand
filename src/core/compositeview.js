;(function(Backbone,Expand){
    Expand.CompositeView = Expand.CollectionView.extend({
        constructor: function(){
            Expand.CollectionView.apply(this, arguments);
        },
        _initialEvents: function() {
            // Bind only after composite view is rendered to avoid adding child views
            // to nonexistent childViewContainer

            if (this.collection) {
              this.listenTo(this.collection, 'add', this._onCollectionAdd);
              this.listenTo(this.collection, 'remove', this._onCollectionRemove);
              this.listenTo(this.collection, 'reset', this._renderChildren);

              if (this.sort) {
                this.listenTo(this.collection, 'sort', this._sortViews);
              }
            }
        },
        render: function() {
            this._ensureViewIsIntact();
            this.isRendered = true;
            this.resetChildViewContainer();

            this._renderChildren();

            //this.triggerMethod('render', this);
            return this;
        },
        _renderChildren: function() {
            if (this.isRendered) {
              Expand.CollectionView.prototype._renderChildren.call(this);
            }
        },
        attachElContent: function(html) {
            this.$el.html(html);
            return this;
        },

        // You might need to override this if you've overridden attachHtml
        attachBuffer: function(compositeView, buffer) {
            var $container = this.getChildViewContainer(compositeView);
            $container.append(buffer);
        },
        // Internal method. Append a view to the end of the $el.
        // Overidden from CollectionView to ensure view is appended to
        // childViewContainer
        _insertAfter: function (childView) {
            var $container = this.getChildViewContainer(this);
            $container.append(childView.el);
        },

        // Internal method to ensure an `$childViewContainer` exists, for the
        // `attachHtml` method to use.
        getChildViewContainer: function(containerView) {
            if ('$childViewContainer' in containerView) {
                return containerView.$childViewContainer;
            }

            var container;
            var childViewContainer = Marionette.getOption(containerView, 'childViewContainer');
            if (childViewContainer) {
                var selector = _.isFunction(childViewContainer) ? childViewContainer.call(containerView) : childViewContainer;
                if (selector.charAt(0) === '@' && containerView.ui) {
                    container = containerView.ui[selector.substr(4)];
                } else {
                    container = containerView.$(selector);
                }
                if (container.length <= 0) {
                    throw new Marionette.Error({
                        name: 'ChildViewContainerMissingError',
                        message: 'The specified "childViewContainer" was not found: ' + containerView.childViewContainer
                    });
                }

            } else {
                container = containerView.$el;
            }

            containerView.$childViewContainer = container;
            return container;
        },

        // Internal method to reset the `$childViewContainer` on render
        resetChildViewContainer: function() {
            if (this.$childViewContainer) {
                delete this.$childViewContainer;
            }
        }
    });
})(Backbone,Backbone.Expand);