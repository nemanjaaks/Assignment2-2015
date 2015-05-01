(function() {
  $.getJSON( '/igMediaCounts')
    .done(function(data) {
          var user_data = data.users;
          var count = 0;
          var currentItem = function(){return user_data[count];};
          var chart = c3.generate({
              bindto: '#chart',
              data: {
                  columns: [
                      [data.mainuser.name, data.mainuser.follows_count],
                      [currentItem().username, currentItem().counts.follows]
                  ],
                  type : 'donut',
                  onclick: function (d, i) { console.log("onclick", d, i); },
                  onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                  onmouseout: function (d, i) { console.log("onmouseout", d, i); }
              },
              donut: {
                  title: "Iris Petal Width"
              }
          });

          var nextItem = function(){
            count++;
            if(count >= user_data.length){
                count = 0;
            }
             return user_data[count];
          };

          var previousItem =function(){
              count--;
              if(count <= 0) {
                  count = user_data.length - 1;
              }
              return user_data[count];
          };



          setInterval(function () {
              var current = currentItem();
              var nextItm = nextItem();
              chart.load({
                  columns: [
                      [nextItm.username,nextItm.counts.follows]
                    ]
              });
              chart.unload({
                  ids: current.username
              });
          }, 2000);
    });
})();
