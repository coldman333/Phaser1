"use strict";define(["jquery","backbone","views/note","views/notes","views/edit-note","views/note-details","models/note"],function(e,t,i,o,n,s,a){var l=t.Router.extend({routes:{"":"home","!/":"home",add:"add","note/:number":"note","note/:number/edit":"noteEdit"},initialize:function(e){this.appView=e.view,this.collection=e.collection,this.collection.fetch()},home:function(){var e=new o({collection:this.collection});this.appView.setViews(e)},add:function(e){var t=new n({model:new a});this.appView.setViews(t),t.on("form:submitted",function(e){this.collection.isEmpty()?e.id=1:e.id=_.max(this.collection.pluck("id"))+1;var t=new a(e);t.isValid()?(this.collection.add(t),t.save(),App.router.navigate("#",{trigger:!0})):alert(t.validationError)},this)},note:function(e){var t=this.collection.get(e),i=new s({model:t});this.appView.setViews(i)},noteEdit:function(e){var t=this.collection.get(e),i=new n({model:t});this.appView.setViews(i),i.on("form:submitted",function(e){var i=t.save(e,{validate:!0});i?(t.save(e),App.router.navigate("#",{trigger:!0})):alert(t.validationError)})}});return l});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJvdXRlci5qcyJdLCJuYW1lcyI6WyJkZWZpbmUiLCIkIiwiQmFja2JvbmUiLCJOb3RlVmlldyIsIk5vdGVzVmlldyIsIkVkaXROb3RlVmlldyIsIk5vdGVzRGV0YWlsc1ZpZXciLCJOb3RlTW9kZWwiLCJSb3V0ZXIiLCJleHRlbmQiLCJyb3V0ZXMiLCIiLCIhLyIsImFkZCIsIm5vdGUvOm51bWJlciIsIm5vdGUvOm51bWJlci9lZGl0IiwiaW5pdGlhbGl6ZSIsIm9wdGlvbnMiLCJ0aGlzIiwiYXBwVmlldyIsInZpZXciLCJjb2xsZWN0aW9uIiwiZmV0Y2giLCJob21lIiwibm90ZXNWaWV3Iiwic2V0Vmlld3MiLCJjaWQiLCJhZGROb3RlVmlldyIsIm1vZGVsIiwib24iLCJmb3JtT2JqIiwiaXNFbXB0eSIsImlkIiwiXyIsIm1heCIsInBsdWNrIiwibmV3Tm90ZSIsImlzVmFsaWQiLCJzYXZlIiwiQXBwIiwicm91dGVyIiwibmF2aWdhdGUiLCJ0cmlnZ2VyIiwiYWxlcnQiLCJ2YWxpZGF0aW9uRXJyb3IiLCJub3RlIiwibm90ZV9pZCIsImdldCIsIm5vdGVzRGV0YWlsc1ZpZXciLCJub3RlRWRpdCIsImVkaXROb3RlVmlldyIsIm1vZGVsRXJyb3IiLCJ2YWxpZGF0ZSJdLCJtYXBwaW5ncyI6IkFBQUEsWUFDQUEsU0FDQyxTQUNBLFdBQ0EsYUFDQSxjQUNBLGtCQUNBLHFCQUNBLGVBQ0csU0FBU0MsRUFBR0MsRUFBVUMsRUFBVUMsRUFBV0MsRUFBY0MsRUFBa0JDLEdBRzlFLEdBQUlDLEdBQVNOLEVBQVNNLE9BQU9DLFFBQ3pCQyxRQUNHQyxHQUFJLE9BQ0pDLEtBQU0sT0FDTkMsSUFBTyxNQUNQQyxlQUFnQixPQUNoQkMsb0JBQXFCLFlBR3hCQyxXQUFZLFNBQVNDLEdBQ2xCQyxLQUFLQyxRQUFVRixFQUFRRyxLQUN2QkYsS0FBS0csV0FBYUosRUFBUUksV0FDMUJILEtBQUtHLFdBQVdDLFNBRXBCQyxLQUFNLFdBRUwsR0FBSUMsR0FBWSxHQUFJcEIsSUFDbEJpQixXQUFZSCxLQUFLRyxZQUVsQkgsTUFBS0MsUUFBUU0sU0FBU0QsSUFHeEJYLElBQUssU0FBVWEsR0FDakIsR0FBSUMsR0FBYyxHQUFJdEIsSUFDdEJ1QixNQUFPLEdBQUlyQixJQUVYVyxNQUFLQyxRQUFRTSxTQUFTRSxHQUV0QkEsRUFBWUUsR0FBRyxpQkFBa0IsU0FBU0MsR0FFckNaLEtBQUtHLFdBQVdVLFVBQ2hCRCxFQUFRRSxHQUFLLEVBRWJGLEVBQVFFLEdBQUtDLEVBQUVDLElBQUloQixLQUFLRyxXQUFXYyxNQUFNLE9BQVMsQ0FHdEQsSUFBSUMsR0FBVSxHQUFJN0IsR0FBVXVCLEVBQ3hCTSxHQUFRQyxXQUNObkIsS0FBS0csV0FBV1IsSUFBSXVCLEdBQ3BCQSxFQUFRRSxPQUNSQyxJQUFJQyxPQUFPQyxTQUFTLEtBQU1DLFNBQVMsS0FFdkNDLE1BQU1QLEVBQVFRLGtCQUVkMUIsT0FFRDJCLEtBQU0sU0FBVUMsR0FFZCxHQUFJRCxHQUFPM0IsS0FBS0csV0FBVzBCLElBQUlELEdBQzNCRSxFQUFtQixHQUFJMUMsSUFDekJzQixNQUFPaUIsR0FFVDNCLE1BQUtDLFFBQVFNLFNBQVN1QixJQUd4QkMsU0FBVSxTQUFVSCxHQUN0QixHQUFJRCxHQUFPM0IsS0FBS0csV0FBVzBCLElBQUlELEdBQzNCSSxFQUFlLEdBQUk3QyxJQUN0QnVCLE1BQU9pQixHQUdSM0IsTUFBS0MsUUFBUU0sU0FBU3lCLEdBRXRCQSxFQUFhckIsR0FBRyxpQkFBa0IsU0FBU0MsR0FFMUMsR0FBSXFCLEdBQWFOLEVBQUtQLEtBQUtSLEdBQVVzQixVQUFTLEdBQzFDRCxJQUNITixFQUFLUCxLQUFLUixHQUNWUyxJQUFJQyxPQUFPQyxTQUFTLEtBQU1DLFNBQVMsS0FFbkNDLE1BQU1FLEVBQUtELHFCQU1mLE9BQU9wQyIsImZpbGUiOiJyb3V0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5kZWZpbmUoW1xuIFwianF1ZXJ5XCIsXG4gXCJiYWNrYm9uZVwiLFxuIFwidmlld3Mvbm90ZVwiLFxuIFwidmlld3Mvbm90ZXNcIixcdFxuIFwidmlld3MvZWRpdC1ub3RlXCIsXG4gXCJ2aWV3cy9ub3RlLWRldGFpbHNcIixcbiBcIm1vZGVscy9ub3RlXCIsXG4gXSAsZnVuY3Rpb24oJCwgQmFja2JvbmUsIE5vdGVWaWV3LCBOb3Rlc1ZpZXcsIEVkaXROb3RlVmlldywgTm90ZXNEZXRhaWxzVmlldywgTm90ZU1vZGVsKXtcbiBcblxuIHZhciBSb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICAgcm91dGVzOiB7XG4gICAgICAgIFwiXCI6IFwiaG9tZVwiLCBcbiAgICAgICAgXCIhL1wiOiBcImhvbWVcIiwgXG4gICAgICAgIFwiYWRkXCI6IFwiYWRkXCIsIFxuICAgICAgICBcIm5vdGUvOm51bWJlclwiOiBcIm5vdGVcIiwgXG4gICAgICAgIFwibm90ZS86bnVtYmVyL2VkaXRcIjogXCJub3RlRWRpdFwiIFxuICAgICB9ICxcblxuICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYXBwVmlldyA9IG9wdGlvbnMudmlldztcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmV0Y2goKTtcbiAgICB9LFxuICAgIGhvbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgXG4gICAgXHR2YXIgbm90ZXNWaWV3ID0gbmV3IE5vdGVzVmlldyh7XG4gICAgXHQgXHRjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb25cbiAgICBcdCB9KTtcbiAgICBcdCB0aGlzLmFwcFZpZXcuc2V0Vmlld3Mobm90ZXNWaWV3KTtcblxuICAgIH0sXG4gICAgYWRkOiBmdW5jdGlvbiAoY2lkKSB7XG5cdFx0dmFyIGFkZE5vdGVWaWV3ID0gbmV3IEVkaXROb3RlVmlldyh7XG5cdFx0bW9kZWw6IG5ldyBOb3RlTW9kZWwoKVxuXHRcdH0pO1xuXHRcdHRoaXMuYXBwVmlldy5zZXRWaWV3cyhhZGROb3RlVmlldyk7XG5cblx0XHRhZGROb3RlVmlldy5vbignZm9ybTpzdWJtaXR0ZWQnLCBmdW5jdGlvbihmb3JtT2JqKSB7XG5cblx0XHRcdGlmKCB0aGlzLmNvbGxlY3Rpb24uaXNFbXB0eSgpICl7XG5cdFx0ICAgIFx0Zm9ybU9iai5pZCA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdCAgICBcdGZvcm1PYmouaWQgPSBfLm1heCh0aGlzLmNvbGxlY3Rpb24ucGx1Y2soJ2lkJykpICsgMVxuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbmV3Tm90ZSA9IG5ldyBOb3RlTW9kZWwoZm9ybU9iaik7XG5cdFx0XHRpZiAobmV3Tm90ZS5pc1ZhbGlkKCkpIHtcblx0XHRcdCAgICAgIHRoaXMuY29sbGVjdGlvbi5hZGQobmV3Tm90ZSk7XG5cdFx0XHQgICAgICBuZXdOb3RlLnNhdmUoKTtcblx0XHRcdCAgICAgIEFwcC5yb3V0ZXIubmF2aWdhdGUoJyMnLCB7dHJpZ2dlcjogdHJ1ZX0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0IGFsZXJ0KG5ld05vdGUudmFsaWRhdGlvbkVycm9yKTsgLy8gdG9kbyB3aXRob3V0IGFsZXJ0XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyk7XG4gICAgfSxcbiAgICBub3RlOiBmdW5jdGlvbiAobm90ZV9pZCkge1xuXG4gICAgICB2YXIgbm90ZSA9IHRoaXMuY29sbGVjdGlvbi5nZXQobm90ZV9pZCk7XG4gICAgICB2YXIgbm90ZXNEZXRhaWxzVmlldyA9IG5ldyBOb3Rlc0RldGFpbHNWaWV3KHtcbiAgICAgICAgbW9kZWw6IG5vdGVcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hcHBWaWV3LnNldFZpZXdzKG5vdGVzRGV0YWlsc1ZpZXcpO1xuICAgICBcbiAgICB9LFxuICAgIG5vdGVFZGl0OiBmdW5jdGlvbiAobm90ZV9pZCkge1xuXHRcdHZhciBub3RlID0gdGhpcy5jb2xsZWN0aW9uLmdldChub3RlX2lkKTtcblx0XHR2YXIgZWRpdE5vdGVWaWV3ID0gbmV3IEVkaXROb3RlVmlldyh7XG5cdFx0XHRtb2RlbDogbm90ZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcHBWaWV3LnNldFZpZXdzKGVkaXROb3RlVmlldyk7XG5cblx0XHRlZGl0Tm90ZVZpZXcub24oJ2Zvcm06c3VibWl0dGVkJywgZnVuY3Rpb24oZm9ybU9iaikge1xuXG5cdFx0XHR2YXIgbW9kZWxFcnJvciA9IG5vdGUuc2F2ZShmb3JtT2JqLCB7dmFsaWRhdGU6dHJ1ZX0pO1xuXHRcdFx0aWYgKG1vZGVsRXJyb3IpIHtcblx0XHRcdFx0bm90ZS5zYXZlKGZvcm1PYmopO1xuXHRcdFx0XHRBcHAucm91dGVyLm5hdmlnYXRlKCcjJywge3RyaWdnZXI6IHRydWV9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFsZXJ0KG5vdGUudmFsaWRhdGlvbkVycm9yKTsgIC8vIHRvZG8gd2l0aG91dCBhbGVydFxuXHRcdFx0fVxuXHRcdH0pO1xuICAgIH1cdFxuIH0pO1xuXG5yZXR1cm4gUm91dGVyOyAgIFxuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
