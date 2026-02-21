'use strict';

const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');

// SPFx 1.22+ compatibility: map `serve` to the maintained serve task.
const getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  const tasks = getTasks.call(build.rig);
  if (tasks.has('serve-deprecated')) {
    tasks.set('serve', tasks.get('serve-deprecated'));
  }
  return tasks;
};

build.initialize(gulp);
