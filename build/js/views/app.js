define(["jquery","underscore","backbone"],function(e,i,n){var t=n.View.extend({el:e("#mainCont"),setViews:function(e){var i=this.view;this.view=e,this.view.render(),this.view.$el.hide(),this.$el.append(this.view.el),this.openView(this.view),this.closeView(i)},openView:function(e){e.$el.slideToggle(500)},closeView:function(i){i&&(i.unbind(),i.$el.slideToggle(500,function(){e(this).remove()}))}});return t});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZpZXdzL2FwcC5qcyJdLCJuYW1lcyI6WyJkZWZpbmUiLCIkIiwiXyIsIkJhY2tib25lIiwiQXBwVmlldyIsIlZpZXciLCJleHRlbmQiLCJlbCIsInNldFZpZXdzIiwidmlldyIsImNsb3NpbmdWaWV3IiwidGhpcyIsInJlbmRlciIsIiRlbCIsImhpZGUiLCJhcHBlbmQiLCJvcGVuVmlldyIsImNsb3NlVmlldyIsInNsaWRlVG9nZ2xlIiwidW5iaW5kIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiQUFBQUEsUUFDRSxTQUNBLGFBQ0EsWUFDQyxTQUFTQyxFQUFHQyxFQUFHQyxHQUdoQixHQUFJQyxHQUFVRCxFQUFTRSxLQUFLQyxRQUMxQkMsR0FBSU4sRUFBRSxhQUNOTyxTQUFXLFNBQVNDLEdBQ2xCLEdBQUlDLEdBQWNDLEtBQUtGLElBQ3ZCRSxNQUFLRixLQUFPQSxFQUNaRSxLQUFLRixLQUFLRyxTQUNWRCxLQUFLRixLQUFLSSxJQUFJQyxPQUNkSCxLQUFLRSxJQUFJRSxPQUFPSixLQUFLRixLQUFLRixJQUMxQkksS0FBS0ssU0FBU0wsS0FBS0YsTUFDbkJFLEtBQUtNLFVBQVVQLElBRWpCTSxTQUFVLFNBQVNQLEdBQ2pCQSxFQUFLSSxJQUFJSyxZQUFZLE1BRXZCRCxVQUFXLFNBQVNSLEdBQ2JBLElBQ0RBLEVBQUtVLFNBQ0xWLEVBQUtJLElBQUlLLFlBQVksSUFBSyxXQUMxQmpCLEVBQUVVLE1BQU1TLGNBTWhCLE9BQU9oQiIsImZpbGUiOiJ2aWV3cy9hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoW1xuICAnanF1ZXJ5JyxcbiAgJ3VuZGVyc2NvcmUnLFxuICAnYmFja2JvbmUnXG5dLCBmdW5jdGlvbigkLCBfLCBCYWNrYm9uZSkgeyBcblxuXG4gIHZhciBBcHBWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAkKCcjbWFpbkNvbnQnKSxcbiAgICBzZXRWaWV3cyA6IGZ1bmN0aW9uKHZpZXcpIHtcbiAgICAgIHZhciBjbG9zaW5nVmlldyA9IHRoaXMudmlldztcbiAgICAgIHRoaXMudmlldyA9IHZpZXc7XG4gICAgICB0aGlzLnZpZXcucmVuZGVyKCk7XG4gICAgICB0aGlzLnZpZXcuJGVsLmhpZGUoKTtcbiAgICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLnZpZXcuZWwpO1xuICAgICAgdGhpcy5vcGVuVmlldyh0aGlzLnZpZXcpO1xuICAgICAgdGhpcy5jbG9zZVZpZXcoY2xvc2luZ1ZpZXcpO1xuICAgIH0sXG4gICAgb3BlblZpZXc6IGZ1bmN0aW9uKHZpZXcpe1xuICAgICAgdmlldy4kZWwuc2xpZGVUb2dnbGUoNTAwKTtcbiAgICB9LFxuICAgIGNsb3NlVmlldzogZnVuY3Rpb24odmlldyl7XG4gICAgICAgaWYgKHZpZXcpe1xuICAgICAgICAgIHZpZXcudW5iaW5kKCk7XG4gICAgICAgICAgdmlldy4kZWwuc2xpZGVUb2dnbGUoNTAwLCBmdW5jdGlvbigpe1xuICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICB9KTtcbiAgICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gQXBwVmlldztcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
