(function() {
  var socket = require('socket.io-client')();
  var keycode = require('keycode');
  var current_post_num = latest_post_num = 0;
  var oldest_post_num = -1;
  var load_permission = true;

  socket.on('new_post', function(data) {
    for (var i = 0; i < data.posts.length; i++) {
      var post = data.posts[i];
      if (post.type === 'photo') {
        var $img = getImgElement(post.photos[0].original_size.url, post.post_url);
        $('<article>')
          .attr('class', 'photo')
          .attr('data-post-num', --latest_post_num)
          .append($img)
          .prependTo($('#posts'));

        if (current_post_num === latest_post_num + 1) {
          current_post_num = latest_post_num;
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
        if ($(this).hasClass('other')) {
          if (post_num - current_post_num > 0) {
            switchPost(post_num + 1);
          } else {
            switchPost(post_num - 1);
          }
          return;
        }
        var dist_y = $(this).offset().top;
        $('html, body').animate({scrollTop: dist_y}, 100);
        current_post_num = post_num;

        if (!load_permission) {
          return;
        }
        if (oldest_post_num - current_post_num <= 10) {
          loadOldPosts();
        }
      }
    });
  }

  var loadOldPosts = function() {
    var offset = oldest_post_num - latest_post_num + 1;

    load_permission = false;

    $.ajax({
      url: '/posts',
      dataType: 'json',
      data: {
        offset: offset
      }
    }).success(function(data) {
      if (data.hasOwnProperty('posts')) {
        appendPosts(data.posts);
        load_permission = true;
      }
    });
  }

  var appendPosts = function(posts) {
    var $old_posts;
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      if (post.type === 'photo') {
        var $img = getImgElement(post.photos[0].original_size.url, post.post_url);
        var $post = $('<article>')
          .attr('class', 'photo')
          .attr('data-post-num', ++oldest_post_num)
          .append($img);
      } else {
        var $post = $('<article>')
          .attr('class', 'other')
          .attr('data-post-num', ++oldest_post_num);
      }

      if (oldest_post_num === 0) {
        socket.emit('start_loading', post.id);
      }

      if ($old_posts === undefined) {
        $old_posts = $post;
      } else {
        $old_posts = $old_posts.add($post);
      }
    }
    $old_posts.appendTo($('#posts'));
  }

  var getImgElement = function(image_url, post_url) {
    var $img = $('<img>').attr('src', image_url);
    return $('<a>').attr({
      'href': post_url,
      'target': '_blank'
    }).append($img);
  }

  loadOldPosts();

})();
