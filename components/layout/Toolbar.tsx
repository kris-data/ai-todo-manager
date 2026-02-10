/**
 * 툴바 컴포넌트
 * 검색, 필터, 정렬 기능 제공
 */

'use client';

import { Search, ArrowUpDown, ListChecks, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
  selectedPriorities: string[];
  onPriorityChange: (priorities: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

/**
 * 검색, 필터, 정렬 툴바
 */
export const Toolbar = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPriorities,
  onPriorityChange,
  sortBy,
  onSortChange,
}: ToolbarProps) => {
  // 상태 필터 토글
  const toggleStatus = (status: string) => {
    if (selectedStatus.includes(status)) {
      onStatusChange(selectedStatus.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatus, status]);
    }
  };

  // 우선순위 필터 토글
  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  // 활성 필터 개수
  const activeFiltersCount = selectedStatus.length + selectedPriorities.length;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* 검색 입력 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="할 일 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 상태 필터 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <ListChecks className="mr-2 h-4 w-4" />
                  상태
                  {selectedStatus.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    >
                      {selectedStatus.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>진행 상태</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedStatus.includes('incomplete')}
                  onCheckedChange={() => toggleStatus('incomplete')}
                >
                  진행 중
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus.includes('completed')}
                  onCheckedChange={() => toggleStatus('completed')}
                >
                  완료됨
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus.includes('overdue')}
                  onCheckedChange={() => toggleStatus('overdue')}
                >
                  지연됨
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 우선순위 필터 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Flag className="mr-2 h-4 w-4" />
                  우선순위
                  {selectedPriorities.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    >
                      {selectedPriorities.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>우선순위</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('high')}
                  onCheckedChange={() => togglePriority('high')}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-red-600">●</span> 높음
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('medium')}
                  onCheckedChange={() => togglePriority('medium')}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-600">●</span> 보통
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('low')}
                  onCheckedChange={() => togglePriority('low')}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-600">●</span> 낮음
                  </span>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 선택 */}
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[140px] h-9">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">우선순위순</SelectItem>
                <SelectItem value="dueDate">마감일순</SelectItem>
                <SelectItem value="createdDate">생성일순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 활성 필터 표시 */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">활성 필터:</span>
            <div className="flex flex-wrap gap-2">
              {/* 상태 필터 배지 */}
              {selectedStatus.map((status) => (
                <Badge 
                  key={status} 
                  variant="secondary" 
                  className="text-xs gap-1 pl-2 pr-1 py-1"
                >
                  <span>
                    {status === 'incomplete' && '진행 중'}
                    {status === 'completed' && '완료됨'}
                    {status === 'overdue' && '지연됨'}
                  </span>
                  <button
                    onClick={() => toggleStatus(status)}
                    className="ml-1 hover:bg-destructive/20 rounded-sm px-1 transition-colors"
                    aria-label={`${status} 필터 제거`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {/* 우선순위 필터 배지 */}
              {selectedPriorities.map((priority) => (
                <Badge 
                  key={priority} 
                  variant="secondary" 
                  className="text-xs gap-1 pl-2 pr-1 py-1"
                >
                  <span className="flex items-center gap-1">
                    {priority === 'high' && <><span className="text-red-600">●</span> 높음</>}
                    {priority === 'medium' && <><span className="text-amber-600">●</span> 보통</>}
                    {priority === 'low' && <><span className="text-slate-600">●</span> 낮음</>}
                  </span>
                  <button
                    onClick={() => togglePriority(priority)}
                    className="ml-1 hover:bg-destructive/20 rounded-sm px-1 transition-colors"
                    aria-label={`${priority} 필터 제거`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            {/* 전체 필터 초기화 버튼 */}
            <button
              onClick={() => {
                onStatusChange([]);
                onPriorityChange([]);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              전체 해제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
