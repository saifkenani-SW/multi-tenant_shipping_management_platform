import { CacheEvict } from '../src/infrastructure/cache/decorators/CacheEvict';
import { CacheContainer } from '../src/infrastructure/cache/container/CacheContainer';

class DummyCacheFacade {
  evictLogs: any[] = [];
  prefixLogs: any[] = [];
  
  async evict(keyParts: any[]) {
    this.evictLogs.push(keyParts);
  }
  
  async evictByPrefix(prefix: string) {
    this.prefixLogs.push(prefix);
  }
}

const fakeFacade = new DummyCacheFacade();
CacheContainer.setModuleRef({
  get: () => fakeFacade
} as any);

class TestService {
  @CacheEvict([
    { keyPrefix: 'list', allEntries: true },
    { keyPrefix: 'details', keyBuilder: (id: string) => ['details', id] }
  ])
  async doSomething(id: string) {
    return 'done ' + id;
  }
}

async function run() {
  const service = new TestService();
  await service.doSomething('123');
  
  console.log('Evict by Prefix calls:', fakeFacade.prefixLogs);
  console.log('Evict exact key calls:', fakeFacade.evictLogs);
  
  if (fakeFacade.prefixLogs.includes('list') && fakeFacade.evictLogs.some(k => k.join(',') === 'details,123')) {
    console.log('SUCCESS: CacheEvict array processed successfully!');
  } else {
    console.log('FAILED!');
  }
}

run().catch(console.error);
