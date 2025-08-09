import { JavaSystemIntegration } from '../externals/java-system';

/**
 * 初始化外部系统集成
 */
export function initializeExternalSystems() {
  // 从环境变量或配置文件读取配置
  const javaSystemConfig = {
    baseURL: process.env.JAVA_SYSTEM_BASE_URL || 'http://localhost:8080/api',
    apiKey: process.env.JAVA_SYSTEM_API_KEY || '',
    secretKey: process.env.JAVA_SYSTEM_SECRET_KEY || '',
  };

  // 初始化Java主系统集成
  JavaSystemIntegration.getInstance(
    javaSystemConfig.baseURL,
    javaSystemConfig.apiKey,
    javaSystemConfig.secretKey
  );

  console.log('✅ 外部系统集成初始化完成');
}
