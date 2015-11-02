define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) { 


  var AppView = Backbone.View.extend({
    el: $('#mainCont'),
    setViews : function(view) {
      var closingView = this.view;
      this.view = view;
      this.view.render();
      this.view.$el.hide();
      this.$el.append(this.view.el);
      this.openView(this.view);
      this.closeView(closingView);
    },
    openView: function(view){
      view.$el.slideToggle(500);
    },
    closeView: function(view){
       if (view){
          view.unbind();
          view.$el.slideToggle(500, function(){
          $(this).remove();
         });
       }
    }
  });

  return AppView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cy9hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKFtcbiAgJ2pxdWVyeScsXG4gICd1bmRlcnNjb3JlJyxcbiAgJ2JhY2tib25lJ1xuXSwgZnVuY3Rpb24oJCwgXywgQmFja2JvbmUpIHsgXG5cblxuICB2YXIgQXBwVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJCgnI21haW5Db250JyksXG4gICAgc2V0Vmlld3MgOiBmdW5jdGlvbih2aWV3KSB7XG4gICAgICB2YXIgY2xvc2luZ1ZpZXcgPSB0aGlzLnZpZXc7XG4gICAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgICAgdGhpcy52aWV3LnJlbmRlcigpO1xuICAgICAgdGhpcy52aWV3LiRlbC5oaWRlKCk7XG4gICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy52aWV3LmVsKTtcbiAgICAgIHRoaXMub3BlblZpZXcodGhpcy52aWV3KTtcbiAgICAgIHRoaXMuY2xvc2VWaWV3KGNsb3NpbmdWaWV3KTtcbiAgICB9LFxuICAgIG9wZW5WaWV3OiBmdW5jdGlvbih2aWV3KXtcbiAgICAgIHZpZXcuJGVsLnNsaWRlVG9nZ2xlKDUwMCk7XG4gICAgfSxcbiAgICBjbG9zZVZpZXc6IGZ1bmN0aW9uKHZpZXcpe1xuICAgICAgIGlmICh2aWV3KXtcbiAgICAgICAgICB2aWV3LnVuYmluZCgpO1xuICAgICAgICAgIHZpZXcuJGVsLnNsaWRlVG9nZ2xlKDUwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIEFwcFZpZXc7XG59KTsiXSwiZmlsZSI6InZpZXdzL2FwcC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
