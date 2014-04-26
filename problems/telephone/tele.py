s = raw_input().strip()

nums = '01234567890123456789'

mini = 1 << 30

for start in range(10):
    total = 0
    for i in s:
        ind = start
        c = 1
        while nums[ind] != i:
            ind += 1
            c += 1
        total += c
    if total < mini:
        mini = total
print mini
