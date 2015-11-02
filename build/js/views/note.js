define([
  'jquery',
  'underscore',
  'backbone',
], function($, _, Backbone) {

  var NoteView = Backbone.View.extend({
    tagName: 'li',
    className: 'media col-md-3 col-sm-4',
    template: _.template( $('#noteItem').html()),
    initialize: function() {
      this.listenTo(this.model, 'remove', this.remove)
    },
    render: function() {
      var html = this.template(this.model.toJSON());
      this.$el.append(html);
      return this;
 
    }

   });

  return NoteView ;
  

});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cy9ub3RlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbXG4gICdqcXVlcnknLFxuICAndW5kZXJzY29yZScsXG4gICdiYWNrYm9uZScsXG5dLCBmdW5jdGlvbigkLCBfLCBCYWNrYm9uZSkge1xuXG4gIHZhciBOb3RlVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0YWdOYW1lOiAnbGknLFxuICAgIGNsYXNzTmFtZTogJ21lZGlhIGNvbC1tZC0zIGNvbC1zbS00JyxcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSggJCgnI25vdGVJdGVtJykuaHRtbCgpKSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgJ3JlbW92ZScsIHRoaXMucmVtb3ZlKVxuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBodG1sID0gdGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKTtcbiAgICAgIHRoaXMuJGVsLmFwcGVuZChodG1sKTtcbiAgICAgIHJldHVybiB0aGlzO1xuIFxuICAgIH1cblxuICAgfSk7XG5cbiAgcmV0dXJuIE5vdGVWaWV3IDtcbiAgXG5cbn0pOyJdLCJmaWxlIjoidmlld3Mvbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
