import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production')
	tracer.init({
		logInjection: true,
	});

export default tracer;
