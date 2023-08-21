import {Project} from 'ts-morph';

describe('IMomentoCache', () => {
  it('has all of the data plane methods that exist on the ICacheClient interface', () => {
    const project = new Project();
    const cacheInterfaceSourceFile = project.addSourceFileAtPath(
      './src/clients/IMomentoCache.ts'
    );
    const cacheInterface =
      cacheInterfaceSourceFile.getInterface('IMomentoCache');
    const cacheInterfaceMembers = cacheInterface!
      .getMethods()
      .map(m => m.getName())
      .sort();
    console.log(`Cache interface members: ${cacheInterfaceMembers.join(',')}`);

    const clientInterfaceSourceFile = project.addSourceFileAtPath(
      './src/clients/ICacheClient.ts'
    );
    const clientInterface =
      clientInterfaceSourceFile.getInterface('ICacheClient');
    const clientInterfaceMembers = clientInterface!
      .getMethods()
      .map(m => m.getName())
      // filter out method names that should only exist on the client
      .filter(m => !['cache'].includes(m))
      .sort();
    console.log(
      `Client interface members: ${clientInterfaceMembers.join(',')}`
    );

    expect(cacheInterfaceMembers).toEqual(clientInterfaceMembers);
  });
});
