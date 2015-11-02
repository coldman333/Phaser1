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

