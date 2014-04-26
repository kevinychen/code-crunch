n, k = map(int, raw_input().strip().split(' '))
heights = []
for i in range(n):
    heights.append(input())

heights.sort()

mini = 1 << 30
for u in range(0, n - k + 1):
    if heights[u + k - 1] - heights[u] < mini:
        mini = heights[u + k - 1] - heights[u]

print mini
