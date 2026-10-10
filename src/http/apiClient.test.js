let mockRejected;
const mockClient=jest.fn();
mockClient.interceptors={request:{use:jest.fn()},response:{use:jest.fn((success,rejected)=>{if(!mockRejected)mockRejected=rejected;})}};
const mockPost=jest.fn();
jest.mock('axios',()=>({__esModule:true,default:{create:()=>mockClient,post:(...args)=>mockPost(...args)}}));
require('./apiClient');
beforeEach(()=>{localStorage.clear();mockPost.mockReset();mockClient.mockReset();});
test('expired bot session reauthenticates when backend omitted refresh token',async()=>{
 localStorage.setItem('id','99');localStorage.setItem('token','bot-fixture');localStorage.setItem('access_token','expired');
 mockPost.mockResolvedValue({status:200,data:{status:200,access_token:'renewed'}});mockClient.mockResolvedValue({status:200});
 const config={headers:{}};await mockRejected({response:{status:401},config});
 expect(mockPost.mock.calls[0][0]).toMatch(/\/login$/);expect(mockPost.mock.calls[0][1]).toEqual({player_id:99,token:'bot-fixture'});expect(localStorage.getItem('access_token')).toBe('renewed');expect(config.headers.Authorization).toBe('Bearer renewed');expect(mockClient).toHaveBeenCalledWith(config);
});
test('refresh token uses refresh endpoint and saves a rotated token',async()=>{
 localStorage.setItem('refresh_token','refresh-fixture');mockPost.mockResolvedValue({status:200,data:{access_token:'new-access',refresh_token:'rotated'}});mockClient.mockResolvedValue({status:200});await mockRejected({response:{status:401},config:{headers:{}}});expect(mockPost.mock.calls[0][0]).toMatch(/\/refresh$/);expect(localStorage.getItem('refresh_token')).toBe('rotated');
});
test('network failure while recovering preserves credentials',async()=>{
 localStorage.setItem('id','99');localStorage.setItem('token','bot-fixture');localStorage.setItem('access_token','expired');const failure=new Error('offline');mockPost.mockRejectedValue(failure);await expect(mockRejected({response:{status:401},config:{headers:{}}})).rejects.toBe(failure);expect(localStorage.getItem('access_token')).toBe('expired');
});
