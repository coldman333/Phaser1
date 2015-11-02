
define(
	[ "backbone"] ,
	function(Backbone){

		var Note = Backbone.Model.extend({

			 defaults: {
			      title: null,
			      description: null
			    }
		});
		return Note;

});