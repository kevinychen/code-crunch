import fractions

n = input()
nums = []
for i in range(n):
    nums.append(input())

u = nums[0]
for z in nums[1:]:
    u = fractions.gcd(u, z)
print u
