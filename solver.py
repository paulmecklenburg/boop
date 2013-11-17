from collections import defaultdict
import random

def _AllCells(size):
    return [(x, y) for x in xrange(size) for y in xrange(size)]


class Puzzle:
    def __init__(self, size, density):
        self.size = size
        num_obstacles = int(size * size * density)
        cells = random.sample(_AllCells(size), num_obstacles + 2)
        self.start = cells[0]
        self.goal = cells[1]
        self.obstacles = set(cells[2:])
        for v in xrange(size):
            self.obstacles.add((-1, v))
            self.obstacles.add((size, v))
            self.obstacles.add((v, -1))
            self.obstacles.add((v, size))

    def solve(self):
        """Returns number of steps taken."""
        steps_to = {self.start: 0}
        queue = [self.start]
        while len(queue) > 0:
            loc = queue.pop(0)
            steps = steps_to[loc]
            if loc == self.goal:
                return steps
            for dst in self._possible_moves(loc):
                if not dst in steps_to:
                    steps_to[dst] = steps + 1
                    queue.append(dst)
        return -1  # raise?                    

    def _neg_y(self, loc):
        for y in xrange(loc[1] - 1, -2, -1):
            if (loc[0], y) in self.obstacles:
                return (loc[0], y + 1)

    def _pos_y(self, loc):
        for y in xrange(loc[1] + 1, self.size + 1):
            if (loc[0], y) in self.obstacles:
                return (loc[0], y - 1)

    def _neg_x(self, loc):
        for x in xrange(loc[0] - 1, -2, -1):
            if (x, loc[1]) in self.obstacles:
                return (x + 1, loc[1])

    def _pos_x(self, loc):
        for x in xrange(loc[0] + 1, self.size + 1):
            if (x, loc[1]) in self.obstacles:
                return (x - 1, loc[1])

    def _possible_moves(self, loc):
        return [self._neg_x(loc), self._pos_x(loc),
                self._neg_y(loc), self._pos_y(loc)]

if __name__ == '__main__':
    for size in xrange(4, 20):
        for density in [.05 * x for x in xrange(18)]:
            hist = defaultdict(int)
            for _ in xrange(5000):
                puzzle = Puzzle(size, density)
                hist[puzzle.solve()] += 1
            print size, density, hist
