(function() {
  var socket = require('socket.io-client')();
  var keycode = require('keycode');
  var current_post_num = last_post_num = 1;

  socket.on('new_post', function(data) {
    for (var i = 0; i < data.posts.length; i++) {
      var post = data.posts[i];
      if (post.type === 'photo') {
        $('<article>')
          .attr('class', 'photo')
          .attr('data-post-num', --last_post_num)
          .append($('<img>').attr('src', post.photos[0].original_size.url))
          .prependTo($('#posts'));

        if (current_post_num === last_post_num + 1) {
          current_post_num = last_post_num;
        }
      }
    }
  });

  $('body')
    .on('keydown', function(e) {
      switch(keycode(e)) {
        case 'j':
          toPrevious();
          break;
        case 'k':
          toNext();
          break;
        default:
          break;
      }
    });

  var toPrevious = function() {
    switchPost(current_post_num + 1);
  }

  var toNext = function() {
    switchPost(current_post_num - 1);
  }

  var switchPost = function(post_num) {
    $('#posts').children().each(function() {
      if ($(this).attr('data-post-num') === post_num.toString()) {
        var dist_y = $(this).offset().top;
        $('html, body').animate({scrollTop: dist_y}, 'fast');
        current_post_num = post_num;
      }
    });
  }
})();