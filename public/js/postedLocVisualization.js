/***** Supplied D3 visualization, with added sorting, animation and hover tooltip*******/
var margin = {top: 20, right: 20, bottom: 100, left: 40};
var w = 960 - margin.left - margin.right;
var h= 500 - margin.top - margin.bottom;

var chart_tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
        return d.username+"<strong> : </strong>"+ d.counts.media;
    });

//define scale of x to be from 0 to width of SVG, with .1 padding in between
var scaleX = d3.scale.ordinal()
    .rangeRoundBands([0, w], .1);

//define scale of y to be from the height of SVG to 0
var scaleY = d3.scale.linear()
    .range([h, 0]);

//define axes
var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(scaleY)
    .orient("left");

//create svg
var count_svg = d3.select("body").selectAll("#media-chart").append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
count_svg.call(chart_tip);
//get json object which contains media counts
d3.json('/igMediaCounts', function(error, data) {
    //set domain of x to be all the usernames contained in the data
    scaleX.domain(data.users.map(function(d) { return d.username; }));
    //set domain of y to be from 0 to the maximum media count returned
    scaleY.domain([0, d3.max(data.users, function(d) { return d.counts.media; })]);

    //set up x axis
    count_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")") //move x-axis to the bottom
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-65)"
        });

    //set up y axis
    count_svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Number of Photos");

    //set up bars in bar graph
    count_svg.selectAll(".bar")
        .data(data.users)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return scaleX(d.username); })
        .attr("width", scaleX.rangeBand())
        .attr("y", function(d) { return scaleY(d.counts.media); })
        .attr("height", function(d) { return h - scaleY(d.counts.media); })
        .on('mouseover',function(d){
            d3.select(this).style("cursor","hand");
            return chart_tip.show(d);
        })
        .on('mousemove', function(){
            chart_tip
                .style("top",(d3.event.pageY+16)+"px")
                .style("left",(d3.event.pageX+16)+"px");
        })
        .on('mouseout',function(d){
            d3.select(this).style("cursor","pointer");
            return chart_tip.hide(d);
        })
        .on('click',function(d){
            console.log("CLICK");
            d3.select("#user-count-img").attr("src", d.profile_picture)
            d3.select("#mediaModalLabel").text(d.username);
            d3.select("#biotext").text(d.bio);
            d3.select("#followers").text("Followers: "+d.counts.followed_by);
            d3.select("#following").text("Following: "+d.counts.followed_by);
            d3.select("#followers").text("Published Media: "+d.counts.media);
            $('#mediaModal').modal('show');

        });

    d3.select("input").on("change", change);



    function change() {
        var sortTimeout = setTimeout(function() {
            d3.select("input").property("checked", true).each(change);
        }, 2000);
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = scaleX.domain(data.users.sort(this.checked
            ? function(a, b) {
            console.log("A:"+a.counts.media+" vs B:"+b.counts.media);
            return a.counts.media - b.counts.media; }
            : function(a, b) { return d3.ascending(a.username, b.username); })
            .map(function(d) { return d.username; }))
            .copy();

        svg.selectAll(".bar")
            .sort(function(a, b) { return x0(a.username) - x0(b.username); });

        var transition = count_svg.transition().duration(750),
            delay = function(d, i) { return i * 50; };

        transition.selectAll(".bar")
            .delay(delay)
            .attr("x", function(d) { return x0(d.username); });

        transition.select(".x.axis")
            .call(xAxis)
            .selectAll("g")
            .delay(delay)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)"
            });;
    }

    d3.select("#media-loading").style("display","none");
    d3.select("#media-chart").style("display","inherit");
    d3.select("#media-checkbox").style("display","inherit");

});




/**
 * Created by nemanjaa on 4/27/15.
 * World map in D3, which shows location of pictures you have liked that have been geotagged
 */
var width = 990,
    height = 550;

var projection = d3.geo.mercator()
    .center([0,25])
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
        return "<strong>"+ d.user.username+"</strong><br/> <span style='color:red'><img src='"+ d.images.thumbnail.url+"'/></span>";
    });

var div = d3.select("body").append("div")
    .attr("class", "tooltipp")
    .style("opacity", 0);

var svg = d3.select("body").selectAll("div.inside-worldmap").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.call(tip);
svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);



d3.json("/json/world-110m2.json", function(error, world) {
    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    //Load and display positions of media extracted from feed
    d3.json("/igRecentMedia", function(error, data) {
        console.log(data.users);


        svg.selectAll("circle")
            .data(data.users)
            .enter()
            .append("a")
            .attr("xlink:href","#worldmap")
            .on('click',function(d){
                d3.select("#head-img").attr("src", d.user.profile_picture)
                d3.select("#photo").attr("src", d.images.low_resolution.url)
                d3.select("#myModalLabel").text(d.user.username);
                d3.select("#locText").text(d.location.name);
                d3.select("#inside-paragraph").text(d.caption.text);
                $('#myModal').modal('show');

            })
            .on('mouseover',function(d){
                console.log("TIP OVER");
                return tip.show(d);
            })
            .on('mousemove', function(){
                tip
                .style("top",(d3.event.pageY+16)+"px")
                .style("left",(d3.event.pageX+16)+"px");
            })
            .on('mouseout',function(d){
                console.log("TIP OVER");
                return tip.hide(d);
            })
            .attr("data-toggle","tooltip")
            .attr("title","someTitle")
            .append("circle")
            .on('mouseover',function(d){
                //tip.show(d);
            return d3.select(this)
                .attr("r",8)
                .style("stroke","black")
                .style("stroke-width",".5px");})

            .on('mouseout',function(){
                //tip.hide;
                return d3.select(this).attr("r",5)
                    .style("stroke","none")
                    .style("stroke-width",".5px");})
            .transition()
            .delay(750)
            .attr("cx", function(d) {
                return projection([d.location.longitude, d.location.latitude])[0];
            })
            .attr("cy", function(d) {
                return projection([d.location.longitude, d.location.latitude])[1];
            })
            .attr("r", 5)
            .style("fill", "#BB4155");

            d3.select("#map-loading").style("display","none");
            d3.select("#worldmap").style("display","inherit");







        /*svg.selectAll("circle")
            .data(data.users)
            .enter()
            .append("a")
            .attr("xlink:href", function(d) {
                return d.link;})
            .append("circle")
            .attr("cx", width/2)
            .attr("cy", height/2)
            .transition()
            .duration(2000)
            .attr("cx", function(d) {
                return projection([d.location.longitude, d.location.latitude])[0];
            })
            .attr("cy", function(d) {
                return projection([d.location.longitude, d.location.latitude])[1];
            })
            .attr("r", 5)
            .style("fill", "red");*/
    });
});

/***
 * C3js Donut Chart showing ratio between number of your followers and the number of followers of your followers
 */

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
                    title: data.mainuser.name+"'s ratio",
                    label: {
                        format: function (value) { return value; }
                    }
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

            d3.select("#ratio-loading").style("display","none");
            d3.select("#chart").style("display","inherit");



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





