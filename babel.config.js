module.exports = function (api) {
  return {
    presets: ['babel-preset-expo'],
    plugins: api.env('test') ? [] : ['nativewind/babel'],
  };
};
