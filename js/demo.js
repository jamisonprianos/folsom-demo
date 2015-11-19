$(document).ready(function () {

  var grid = $('#grid');
  var currentMap = undefined;
  var history = [];
  var pos = [0, 0];
  var automationDelay = 100;
  var autoPlay = false;
  var stepIndex = 0;
  var currentMapName = 'simple';
  var algorithm = 'simple';
  var state = 'ready';

  for (var y = 0; y < 12; y++) {
    var row = $('<div></div>').addClass('row').data('row', y);
    for (var x = 0; x < 12; x++) {
      row.append($('<div></div>').addClass('col-xs-1').data('col', y).attr('id', 'grid_' + x + '_' + y));
    }
    row.appendTo(grid);
  }

  function chooseMap(mapName) {
    currentMapName = mapName;
    reset();
  }

  function setMap(map) {
    currentMap = JSON.parse(JSON.stringify(map));
    for (var y = 0; y < 12; y++) {
      for (var x = 0; x < 12; x++) {      
        var node = $('#grid_' + x + '_' + y);
        node.removeClass('blocked current goal visited');
        if (map[y][x] === 1)
          node.addClass('blocked');
        if (map[y][x] === 2) {
          node.addClass('current');
          history = [];
          $('#message').text('');
          moveTo(x, y);
          $('#coordinates').text('(' + x + ', ' + y + ')');
        }
        if (map[y][x] === 3)
          node.addClass('goal');
        if (map[y][x] === 4)
          node.addClass('visited');
      }
    }
    state = 'ready';
    stepIndex = 0;
  }

  function reset() {
    setMap(window.maps[currentMapName]);
  }

  $('.btn-reset-map').click(reset);

  function win() {
    autoPlay = false;
    $('#message').text('You Win!');
    $('#messageModal').modal('show');
    state = 'winner';
  }

  function moveError() {
    autoPlay = false;
    $('#message').text('Blocked');
    $('#messageModal').modal('show');
  }

  function outOfBounds() {
    autoPlay = false;
    $('#message').text('Out of Bounds');
    $('#messageModal').modal('show');
  }

  function giveUp() {
    autoPlay = false;
    $('#message').text('I Give Up!');
    $('#messageModal').modal('show');
    state = 'failed';
  }

  function moveTo(x, y, skipHistory) {
    $('#next_coords').text('(' + x + ', ' + y + ')');
    if (y < 0 || y > 11 || x < 0 || x > 22) {
      return outOfBounds();
    }
    var v = currentMap[y][x];
    if (v === 1) {
      return moveError();
    }
    if (v === 4 || v === 2 || v === 0 || v === 3) {
      if (!skipHistory) { history.push(pos); }
      currentMap[y][x] = 4;
      pos = [x, y];
      $('#coordinates').text('(' + x + ', ' + y + ')');
      $('.current').removeClass('current');
      $('#grid_' + x + '_' + y).addClass('current visited').removeClass('goal');
      if (v === 3) {
        return win();
      }
    }
  }

  function testCoord(x, y, allowBacktrack) {
    $('#next_coords').text('(' + x + ', ' + y + ')');
    if (y < 0 || y > 11 || x < 0 || x > 22) {
      return false;
    }
    var v = currentMap[y][x];
    console.log([allowBacktrack, v]);
    if (v === 1 || (!allowBacktrack && v === 4)) {
      return false;
    } else if (v === 2 || v === 0 || v === 3 || (allowBacktrack && v === 4)) {
      return true;
    }
  }

  $('.btn-move-down').click(function () {
    moveTo(pos[0], pos[1] + 1);
  });

  $('.btn-move-up').click(function () {
    moveTo(pos[0], pos[1] - 1);
  });

  $('.btn-move-left').click(function () {
    moveTo(pos[0] - 1, pos[1]);
  });

  $('.btn-move-right').click(function () {
    moveTo(pos[0] + 1, pos[1]);
  });

  function moveBack() {
    var last = history.pop();
    moveTo(last[0], last[1], true);
  }

  function executeStep(steps) {
    if (state !== 'ready') return;
    var i = stepIndex % steps.length;
    var step = steps[i];
    $('#steps li').removeClass('btn-success').addClass('btn-secondary');
    $('#steps li#step-' + i).addClass('btn-success').removeClass('btn-secondary');
    if (step === 'moveRight') {
      moveTo(pos[0] + 1, pos[1]);
      stepIndex = -1;
    } else if (step === 'moveLeft') {
      moveTo(pos[0] - 1, pos[1]);
      stepIndex = -1;
    } else if (step === 'moveDown') {
      moveTo(pos[0], pos[1] + 1);
      stepIndex = -1;
    } else if (step === 'moveUp') {
      moveTo(pos[0], pos[1] - 1);
      stepIndex = -1;
    } else if (step === 'moveBack') {
      moveBack();
      stepIndex = -1;
    } else if (step === 'if (right:new)') {
      if (!testCoord(pos[0] + 1, pos[1])) {
        stepIndex++;
      }
    } else if (step === 'if (left:new)') {
      if (!testCoord(pos[0] - 1, pos[1])) {
        stepIndex++;
      }
    } else if (step === 'if (down:new)') {
      if (!testCoord(pos[0], pos[1] + 1)) {
        stepIndex++;
      }
    } else if (step === 'if (up:new)') {
      if (!testCoord(pos[0], pos[1] - 1)) {
        stepIndex++;
      }
    } else if (step === 'if (right:open)') {
      if (!testCoord(pos[0] + 1, pos[1], true)) {
        stepIndex++;
      }
    } else if (step === 'if (left:open)') {
      if (!testCoord(pos[0] - 1, pos[1], true)) {
        stepIndex++;
      }
    } else if (step === 'if (down:open)') {
      if (!testCoord(pos[0], pos[1] + 1, true)) {
        stepIndex++;
      }
    } else if (step === 'if (up:open)') {
      if (!testCoord(pos[0], pos[1] - 1, true)) {
        stepIndex++;
      }
    } else if (step === 'if (position:start)') {
      if (pos[0] > 0 || pos[1] > 0) {
        stepIndex++;
      }
    } else if (step === 'giveUp') {
      giveUp();
    }
    stepIndex++;
  }

  var algorithms = {
    lost: [
      'if (right:open)',
      'moveRight',
      'if (down:open)',
      'moveDown',
      'if (left:open)',
      'moveLeft',
      'if (up:open)',
      'moveUp'
    ],
    simple: [
      'if (down:open)', 'moveDown', 'moveRight'
    ],
    depthFirst: [
      'if (right:new)',
      'moveRight',
      'if (down:new)',
      'moveDown',
      'if (left:new)',
      'moveLeft',
      'if (up:new)',
      'moveUp',
      'if (position:start)',
      'giveUp',
      'moveBack'
    ]
  };

  steps = algorithms[algorithm];

  $('.btn-algo').click(function () {
    steps = algorithms[$(this).data('algo')];
    $('.btn-algo').removeClass('btn-primary');
    $(this).addClass('btn-primary');
    resetSteps();
  });

  function resetSteps() {
    var stepId = 0;
    $('#steps').empty();
    steps.forEach(function (step) {
      $('#steps').append($("<li></li>").text(step).addClass('btn btn-secondary').attr('id', 'step-' + stepId++));
    });
  }

  resetSteps();
  
  $('.btn-play').click(function () {
    if (!autoPlay) {
      autoPlay = true;
      nextStep(steps, stepIndex);
    }
  });

  $('.btn-stop').click(function () {
    autoPlay = false;
  })

  $('.btn-step').click(function () {
    if (!autoPlay) {
      executeStep(steps);
    }
  });

  $('.btn-speed').click(function (e) {
    automationDelay = $(this).data('speed');
    $('.btn-speed').removeClass('btn-primary');
    $(this).addClass('btn-primary');
  });

  $('.btn-map').click(function (e) {
    chooseMap($(this).data('map'));
    $('.btn-map').removeClass('btn-primary');
    $(this).addClass('btn-primary');    
  })

  reset();

  $('[title]').tooltip();

  $('.btn-control-manual').click(function () {
    $('.btn-control-auto').removeClass('btn-primary');
    $('.btn-control-manual').addClass('btn-primary');
    $('.automatic-controls').hide();
    $('.manual-controls').show();
  });

  $('.btn-control-auto').click(function () {
    $('.btn-control-manual').removeClass('btn-primary');
    $('.btn-control-auto').addClass('btn-primary');
    $('.automatic-controls').show();
    $('.manual-controls').hide();
  });

  function nextStep(steps, index) {
    setTimeout(function () {
      executeStep(steps);
      if (autoPlay) { nextStep(steps); }
    }, automationDelay);
  }

});