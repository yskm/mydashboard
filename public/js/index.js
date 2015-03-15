(function() {
	var socket = require('socket.io-client')();

	socket.on('new_post', function(data) {
		for (var i = 0; i < data.posts.length; i++) {
			var post = data.posts[i];
			if (post.type === 'photo') {
				$('<article>')
					.attr('class', 'photo')
					.append($('<img>').attr('src', post.photos[0].original_size.url))
					.prependTo($('#posts'));
			}
		}
	});
})();