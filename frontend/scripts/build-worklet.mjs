import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/worklet/processor.js'],
  bundle: true,
  format: 'iife',
  outfile: 'public/processor.js',
  target: 'es2020',
};

if (isWatch) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log('Watching for worklet changes...');
} else {
  await esbuild.build(options);
  console.log('Worklet built successfully.');
}
