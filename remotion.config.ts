import { Config } from '@remotion/cli/config';

Config.setConcurrency(2);
Config.setTimeoutInMilliseconds(3600000);
Config.setChromiumOpenGlRenderer('angle');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setMuted(true);
